// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IEncryptedFileToken.sol";
import "./IEncryptedFileTokenCallbackReceiver.sol";

contract FilemarketExchangeV3 is IEncryptedFileTokenCallbackReceiver, Context, Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    struct Order {
        IEncryptedFileToken token;
        uint256 tokenId;
        uint256 price;
        IERC20 currency;
        address payable initiator;
        address payable receiver;
        bool fulfilled;
    }

    event FeeChanged(uint256 newFee);
    
    uint256 public constant PERCENT_MULTIPLIER = 10000;
    uint256 public constant royaltyCeiling = PERCENT_MULTIPLIER;
    
    uint256 public fee;               // fee as percentage * PERCENT_MULTIPLIER / 100
    uint256 public accumulatedFees;
    IERC20[] public tokensReceived; // array to track what ERC20 tokens we received
    mapping(IERC20 => uint256) public accumulatedFeesERC20;

    mapping(IEncryptedFileToken => uint256) public whitelistDeadlines;
    mapping(IEncryptedFileToken => uint256) public whitelistDiscounts;  // 1 - 0.01%

//    mapping(IEncryptedFileToken => mapping(uint256 => Order)) public orders;
    mapping(IEncryptedFileToken => mapping(uint256 => uint256)) public orderPrices;
    mapping(IEncryptedFileToken => mapping(uint256 => IERC20)) public orderCurrencies;
    mapping(IEncryptedFileToken => mapping(uint256 => address)) public orderInitiators;
    mapping(IEncryptedFileToken => mapping(uint256 => address)) public orderReceivers;
    mapping(IEncryptedFileToken => mapping(uint256 => bool)) public orderFulfilled;


    constructor() {
    }

    function setFee(uint256 _fee) external onlyOwner {
        require(_fee <= PERCENT_MULTIPLIER / 2, "FilemarketExchangeV2: fee cannot be more than 50%");
        fee = _fee;
        emit FeeChanged(_fee);
    }

    function setWhitelistParams(
        IEncryptedFileToken collection,
        uint256 deadline,
        uint256 discount
    ) external onlyOwner {
        whitelistDeadlines[collection] = deadline;
        whitelistDiscounts[collection] = discount;
    }

    function placeOrder(
        IEncryptedFileToken token,
        uint256 tokenId,
        uint256 price,
        IERC20 currency
    ) external {
        require(price > 0, "FilemarketExchangeV2: price must be positive");
        require(token.supportsInterface(type(IEncryptedFileToken).interfaceId));
        require(orderPrices[token][tokenId] == 0, "FilemarketExchangeV2: order exists");
//        orders[token][tokenId] = Order(token, tokenId, price, currency, payable(_msgSender()), payable(0), false);
        if (address(currency) != address(0)) {
            orderCurrencies[token][tokenId] = currency;
        }
        orderPrices[token][tokenId] = price;
        orderInitiators[token][tokenId] = _msgSender();
        token.draftTransfer(tokenId, IEncryptedFileTokenCallbackReceiver(this));
    }

    function placeOrderBatch(
        IEncryptedFileToken token,
        uint256[] calldata tokenIds,
        uint256 price,
        IERC20 currency
    ) external {
        require(price > 0, "FilemarketExchangeV2: price must be positive");
        require(token.supportsInterface(type(IEncryptedFileToken).interfaceId));
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(orderPrices[token][tokenIds[i]] == 0, "FilemarketExchangeV2: order exists");
//            orders[token][tokenIds[i]] = Order(token, tokenIds[i], price, currency, payable(_msgSender()), payable(0), false);
            if (address(currency) != address(0)) {
                orderCurrencies[token][tokenIds[i]] = currency;
            }
            orderPrices[token][tokenIds[i]] = price;
            orderInitiators[token][tokenIds[i]] = _msgSender();
            token.draftTransfer(tokenIds[i], IEncryptedFileTokenCallbackReceiver(this));
        }
    }

    function fulfillOrder(
        IEncryptedFileToken token,
        bytes calldata publicKey,
        uint256 tokenId,
        bytes calldata data
    ) external payable {
//        Order storage order = orders[token][tokenId];
        uint256 price = orderPrices[token][tokenId];
        require(price != 0, "FilemarketExchangeV2: order doesn't exist");
        require(!orderFulfilled[token][tokenId], "FilemarketExchangeV2: order was already fulfilled");
        require(whitelistDeadlines[token] == 0 || whitelistDeadlines[token] < block.timestamp, "FilemarketExchangeV2: whitelist period");

        IERC20 currency = orderCurrencies[token][tokenId];
        if (currency != IERC20(address(0))) {
            require(currency.allowance(_msgSender(), address(this)) >= price, "FilemarketExchangeV2: allowance must be >= price");
            currency.safeTransferFrom(_msgSender(), address(this), price);
        } else {
            require(msg.value == price, "FilemarketExchangeV2: value must equal");
        }
        orderReceivers[token][tokenId] = _msgSender();
        orderFulfilled[token][tokenId] = true;
//        order.receiver = payable(_msgSender());
//        order.fulfilled = true;
        token.completeTransferDraft(tokenId, _msgSender(), publicKey, data);
    } 

//    function fulfillOrderWhitelisted(
//        IEncryptedFileToken token,
//        bytes calldata publicKey,
//        uint256 tokenId,
//        bytes calldata signature,
//        bytes calldata data
//    ) external payable {
//        Order storage order = orders[token][tokenId];
//        require(order.price != 0, "FilemarketExchangeV2: order doesn't exist");
//        require(!order.fulfilled, "FilemarketExchangeV2: order was already fulfilled");
//        require(whitelistDeadlines[token] != 0, "FilemarketExchangeV2: collection doesn't have whitelist");
//        require(whitelistDeadlines[token] > block.timestamp, "FilemarketExchangeV2: whitelist deadline exceeds");
//        bytes32 address_bytes = bytes32(uint256(uint160(_msgSender())));
//        require(address_bytes.toEthSignedMessageHash().recover(signature) == owner(), "FilemarketExchangeV2: whitelist invalid signature");
//
//        uint256 discount = (order.price*whitelistDiscounts[token])/PERCENT_MULTIPLIER;
//        uint256 discount_price = order.price - discount;
//        if (order.currency != IERC20(address(0))) {
//            require(order.currency.allowance(_msgSender(), address(this)) >= discount_price, "FilemarketExchangeV2: allowance must be >= price with discount");
//            order.currency.safeTransferFrom(_msgSender(), address(this), discount_price);
//        } else {
//            require(msg.value == discount_price, "FilemarketExchangeV2: value must equal price with discount");
//        }
//        order.receiver = payable(_msgSender());
//        order.fulfilled = true;
//        order.token.completeTransferDraft(order.tokenId, order.receiver, publicKey, data);
//    }

    function cancelOrder(
        IEncryptedFileToken token,
        uint256 tokenId
    ) external {
        uint256 price = orderPrices[token][tokenId];
//        Order storage order = orders[token][tokenId];
        require(price != 0, "FilemarketExchangeV2: order doesn't exist");
        require(!orderFulfilled[token][tokenId], "FilemarketExchangeV2: order was fulfilled");
        token.cancelTransfer(tokenId);
        delete orderPrices[token][tokenId];
        delete orderInitiators[token][tokenId];
        delete orderCurrencies[token][tokenId];
    }

    function transferCancelled(uint256 tokenId) external {
        IEncryptedFileToken token = IEncryptedFileToken(_msgSender());
        uint256 price = orderPrices[token][tokenId];
//        Order storage order = orders[IEncryptedFileToken(_msgSender())][tokenId];
        require(price != 0, "FilemarketExchangeV2: order doesn't exist");
        if (orderFulfilled[token][tokenId]) {
            safeTransferCurrency(orderCurrencies[token][tokenId], payable(orderReceivers[token][tokenId]), price);
        }
//        delete orders[IEncryptedFileToken(_msgSender())][tokenId];
        delete orderPrices[token][tokenId];
        delete orderInitiators[token][tokenId];
        delete orderCurrencies[token][tokenId];
        delete orderReceivers[token][tokenId];
        delete orderFulfilled[token][tokenId];
    }

    function transferFinished(uint256 tokenId) external {
        IEncryptedFileToken token = IEncryptedFileToken(_msgSender());
        uint256 price = orderPrices[token][tokenId];
//        Order storage order = orders[IEncryptedFileToken(_msgSender())][tokenId];
        require(price != 0, "FilemarketExchangeV2: order doesn't exist");
        require(orderFulfilled[token][tokenId], "FilemarketExchangeV2: order wasn't fulfilled");

        IERC20 currency = orderCurrencies[token][tokenId];
        uint256 receiverAmount = calculateFee(price, currency);
        receiverAmount = payoffRoyalty(tokenId, receiverAmount, currency, receiverAmount);
        safeTransferCurrency(currency, payable(orderInitiators[token][tokenId]), receiverAmount);

//        delete orders[IEncryptedFileToken(_msgSender())][tokenId];
        delete orderPrices[token][tokenId];
        delete orderInitiators[token][tokenId];
        delete orderCurrencies[token][tokenId];
        delete orderReceivers[token][tokenId];
        delete orderFulfilled[token][tokenId];
    }

    function transferFraudDetected(uint256 tokenId, bool approved) external {
        IEncryptedFileToken token = IEncryptedFileToken(_msgSender());
        uint256 price = orderPrices[token][tokenId];
//        Order storage order = orders[IEncryptedFileToken(_msgSender())][tokenId];
        require(price != 0, "FilemarketExchangeV2: order doesn't exist");
        require(orderFulfilled[token][tokenId], "FilemarketExchangeV2: order wasn't fulfilled");
        IERC20 currency = orderCurrencies[token][tokenId];
        if (approved) {
            safeTransferCurrency(currency, payable(orderReceivers[token][tokenId]), price);
        } else {
            uint256 receiverAmount = calculateFee(price, currency);
            receiverAmount = payoffRoyalty(tokenId, receiverAmount, currency, receiverAmount);
            safeTransferCurrency(currency, payable(orderInitiators[token][tokenId]), receiverAmount);
        }
//        delete orders[IEncryptedFileToken(_msgSender())][tokenId];
        delete orderPrices[token][tokenId];
        delete orderInitiators[token][tokenId];
        delete orderCurrencies[token][tokenId];
        delete orderReceivers[token][tokenId];
        delete orderFulfilled[token][tokenId];
    }

    function payoffRoyalty(uint256 tokenId, uint256 price, IERC20 currency, uint256 finalAmount) internal returns (uint256) {
        try IERC2981(_msgSender()).royaltyInfo(tokenId, price) returns (address receiver, uint royaltyAmount) {
            require(royaltyAmount <= price * royaltyCeiling / PERCENT_MULTIPLIER, "FilemarketExchangeV2: royalty % is too high");
            if (receiver != address(0) && royaltyAmount > 0) {
                finalAmount -= royaltyAmount;
                safeTransferCurrency(currency, payable(receiver), royaltyAmount);
            }
        } catch {}

        return finalAmount;
    }

    function calculateFee(uint256 price, IERC20 currency) internal returns (uint256){
        uint256 feeAmount = (price * fee) / PERCENT_MULTIPLIER;
        uint256 receiverAmount = price - feeAmount;

        if (currency != IERC20(address(0))) {
            if (accumulatedFeesERC20[currency] == 0) {
                tokensReceived.push(currency);
            }
            accumulatedFeesERC20[currency] += feeAmount;
        } else {
            accumulatedFees += feeAmount;
        }

        return receiverAmount;
    }

    function safeTransferCurrency(IERC20 currency, address payable to, uint256 amount) internal {
        if (currency != IERC20(address(0))) {
            currency.safeTransfer(to, amount);
        } else {
            to.transfer(amount);
        }
    }


    function withdrawFees(address payable to, IERC20 currency) external onlyOwner {
        if (currency == IERC20(address(0))) {
            require(accumulatedFees > 0, "Mark3dExchange: No fee to withdraw");
            uint256 amount = accumulatedFees;
            accumulatedFees = 0;
            to.transfer(amount);
        } else {
            require(accumulatedFeesERC20[currency] > 0, "Mark3dExchange: No fee to withdraw");
            uint256 feeAmount = accumulatedFeesERC20[currency];
            accumulatedFeesERC20[currency] = 0;
            currency.safeTransfer(to, feeAmount);
        }
    }
}
