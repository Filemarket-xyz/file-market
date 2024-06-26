import {bufferToHex} from './utils';
import {eftAesDerivationNative} from './eft-derivation';
import {aesDecryptNative, aesEncryptNative} from './aes';

const globalSalt = Buffer.from('137d63f71265a151c69a5158e20675b51ae359133fdcace8a7294b7af2f0d05d4561d8ea180b6698abb70ff110376517c6ad7968090c2d576b3dbf208af4e841', 'hex')
const address = '0x736367086A8920EF71C1F68a11e6CeB8b6026a13'
const seed = Buffer.from('94d7d898760df59af1097d7b34bd9d09', 'hex')
const data = Buffer.from('851989cf49a9415f9d8e8b7eec8755fe1dc49d5f8b07473b57d9ec46e93c6e9f', 'hex')

describe('aes', () => {
  it('should encrypt and decrypt data', async () => {
    const collectionAddress = Buffer.from(address.slice(2))
    const keyAndIv = await eftAesDerivationNative(window.crypto)(seed, globalSalt, collectionAddress, 0)
    const encryptedData = await aesEncryptNative(window.crypto)(data, keyAndIv)
    const decryptedData = await aesDecryptNative(window.crypto)(encryptedData, keyAndIv.key)
    expect(bufferToHex(decryptedData)).toEqual(bufferToHex(data))
    expect(bufferToHex(encryptedData)).not.toEqual(bufferToHex(data))
  })
})
