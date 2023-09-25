import { makeAutoObservable } from 'mobx'

import { type Api, type CollectionData } from '../../../swagger/Api'
import { gradientPlaceholderImg } from '../../UIkit'
import { getHttpLinkFromIpfsString } from '../../utils/nfts/getHttpLinkFromIpfsString'
import { getProfileImageUrl } from '../../utils/nfts/getProfileImageUrl'
import { reduceAddress } from '../../utils/nfts/reduceAddress'
import {
  type IActivateDeactivate,
  type IStoreRequester,
  type RequestContext,
  storeRequest,
  storeReset,
} from '../../utils/store'
import { lastItem } from '../../utils/structs'
import { type CurrentBlockChainStore } from '../CurrentBlockChain/CurrentBlockChainStore'
import { type ErrorStore } from '../Error/ErrorStore'
import { type MultiChainStore } from '../MultiChain/MultiChainStore'

export class CollectionTokenListStore implements IActivateDeactivate<[string, string]>, IStoreRequester {
  errorStore: ErrorStore
  currentBlockChainStore: CurrentBlockChainStore
  multiChainStore: MultiChainStore

  currentRequest?: RequestContext
  requestCount = 0
  isLoaded = false
  isLoading = false
  isActivated = false

  data: CollectionData = {
    total: 0,
  }

  api?: Api<{}>

  collectionAddress = ''

  isCustomApi: boolean = true
  constructor({ errorStore, currentBlockChainStore, multiChainStore }: {
    errorStore: ErrorStore
    currentBlockChainStore: CurrentBlockChainStore
    multiChainStore: MultiChainStore
  }) {
    this.errorStore = errorStore
    this.currentBlockChainStore = currentBlockChainStore
    this.multiChainStore = multiChainStore
    makeAutoObservable(this, {
      errorStore: false,
      currentBlockChainStore: false,
      multiChainStore: false,
    })
  }

  setData(data: CollectionData) {
    this.data = data || {}
  }

  addData(data: CollectionData) {
    if (!this.data.tokens) {
      this.data.tokens = []
    }
    this.data.tokens.push(...(data?.tokens ?? []))
    this.data.total = data.total
  }

  private request(api?: Api<{}>) {
    if (!api) return
    storeRequest(
      this,
      api.collections.fullDetail(this.collectionAddress, { limit: 10 }),
      (data) => { this.setData(data) },
    )
  }

  requestMore() {
    const lastTokenId = lastItem(this.data.tokens ?? [])?.tokenId
    storeRequest(
      this,
      this.currentBlockChainStore.api.collections.fullDetail(this.collectionAddress, { lastTokenId, limit: 10 }),
      (data) => { this.addData(data) },
    )
  }

  activate(collectionAddress: string, chainName: string): void {
    this.isActivated = true
    this.collectionAddress = collectionAddress
    console.log(collectionAddress)
    console.log(chainName)
    console.log(this.multiChainStore)
    this.api = this.multiChainStore.getApiByName(chainName)
    console.log(this.api)
    this.request(this.api)
  }

  deactivate(): void {
    this.reset()
    this.isActivated = false
  }

  reset(): void {
    storeReset(this)
  }

  reload(): void {
    this.request()
  }

  get hasMoreData() {
    const { total = 0, tokens = [] } = this.data

    return tokens.length < total
  }

  get nftCards() {
    if (!this.data.tokens) return []

    return this.data.tokens.map((token) => ({
      collectionName: this.data.collection?.name ?? '',
      imageURL: token.image ? getHttpLinkFromIpfsString(token.image) : gradientPlaceholderImg,
      title: token.name ?? '—',
      user: {
        img: getProfileImageUrl(token.owner ?? ''),
        address: reduceAddress(this.data.collection?.owner ?? ''),
      },
      button: {
        link: `/collection/${this.currentBlockChainStore.chain?.name}/${token.collectionAddress}/${token.tokenId}`,
        text: 'Go to page',
      },
      hiddenFile: token.hiddenFileMeta,
      hiddenFileMeta: token.hiddenFileMeta,
      chainName: this.currentBlockChainStore.chain?.name,
      chainImg: this.currentBlockChainStore.configChain?.imgGray,
    }))
  }
}
