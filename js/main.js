import { userRequest, USER_INDEX_URL } from './config.js'
import { countValue, getDefault, getUserHtml, putModalData, classToggle, saveToCache } from './lib.js'

const dataPanel = document.querySelector('#data-panel')
const LIMIT = 24  // 單次需求數

let flag = 0           // 下方scroll監聽事件使用的flag
const tempData = []    // 供 putRandomUser() 隨機產生 user 使用
let currentData = []   // 存放頁面上, 當前存在的data, 供 mode切換 抓資料用

const currentPage = new URLSearchParams(location.search)
const route = currentPage.get('route') || 'find'

function putRandomUser(limit) {
  // 打亂 Array 排列, 產生隨機效果
  tempData.sort(() => 0.5 - Math.random())

  // 抽選 {limit} 個 user
  const pickRandom = []
  for (let i = 0; i < limit; i++) {
    // 如已抽光, 不執行下面code
    if (!tempData[0]) continue

    // 會從 tempData 移除, 確保不會出現重複user
    pickRandom.push(tempData.pop())
  }

  // put into #data-panel
  dataPanel.innerHTML += getUserHtml(pickRandom, dataPanel.dataset.mode)

  // 紀錄當前data
  currentData.push(...pickRandom)

  // count數量, 顯示於 Navbar
  countValue('#nav-find', dataPanel.children.length)

  // request 完成後, 重設flag
  flag = 0
}

function putUserData(limit) {
  const followingList = [...JSON.parse(sessionStorage.getItem('following'))]

  if (!followingList.length) { $('#content-status').text('No following users') }
  else { $('#content-status').remove() }

  // 處理分頁數量
  const start = currentData.length
  const pickData = followingList.slice(start, start + limit)

  // put into #data-panel
  dataPanel.innerHTML += getUserHtml(pickData, dataPanel.dataset.mode)

  // 紀錄當前data
  currentData.push(...pickData)

  // request 完成後, 重設flag
  flag = 0
}

// ====================
// 執行序
// ====================

// 初始化, 取得瀏覽器cache
getDefault(dataPanel)

if (route === 'find') {
  // 向API請求資料
  userRequest.get(USER_INDEX_URL)
    .then(res => {
      tempData.push(...res.data.results)
      $('#content-status').remove()
      putRandomUser(LIMIT)
    })
}

if (route === 'following') {
  // 取出瀏覽器cache, 刷新頁面
  putUserData(LIMIT)

  $('#nav-find').toggleClass('active')
  $('#nav-following').toggleClass('active')
}

// 監聽 #data-Panel click事件, 顯示user detail & 設置follow btn
$(dataPanel).on('click', e => {
  if (e.target.matches('.show-modal')) {
    putModalData(e)
  }

  if (e.target.matches('.btn-follow')) {
    // 建立瀏覽器緩存, 存放Following list
    const targetUser = currentData.find(user => user.id === (+e.target.dataset.id))
    saveToCache(targetUser)

    // 轉換btn樣式
    classToggle(e.target)

    // count數量, 顯示於 Navbar
    const count = JSON.parse(sessionStorage.getItem('following')).length
    countValue('#nav-following', count)
  }
})

// 監聽 Form Search
$('#search-form').on('submit', e => {
  e.preventDefault()

  // 將搜尋關鍵字 format 成 RegExp
  const inputValue = $('#search-input').val()
  if (!inputValue) return false
  const regex = new RegExp(inputValue, 'i')

  // 從API server過濾資料
  userRequest.get(USER_INDEX_URL)
    .then(res => {
      const data = res.data.results

      // 過濾包含搜尋關鍵字的帳號名
      const results = data.filter(user => {
        // 取得帳號字串 "xxxx@example.com" => "xxxx"
        const account = user.email.split('@')[0]
        return account.match(regex)
      })

      // 刷新 #data-panel
      $('#search-info').text(`搜尋 ${inputValue} 共有 ${results.length} 項符合`)
      dataPanel.innerHTML = getUserHtml(results, dataPanel.dataset.mode)

      // 刷新 currentData
      currentData = results

      // 將 Find 的數量歸零
      countValue('#nav-find', 0)
    })
})

// 監聽 list-mode toggler
$('#list-mode').on('click', e => {
  // 查看並保存click目標, dataset中的mode type
  const mode = $(e.target).attr('data-mode')

  // 在dataPanel立flag, 紀錄當前mode type, 供其他功能調用
  $(dataPanel).attr('data-mode', mode)

  // 切換mode, 高亮當前mode
  dataPanel.innerHTML = getUserHtml(currentData, mode)
  $('#list-mode .active').toggleClass('active')
  e.target.classList.toggle('active')

  // 將當前mode登錄到cache
  sessionStorage.setItem('mode', mode)
})

// 監聽 scroll, 下拉時加入新 user data
$(window).on('scroll', () => {
  // search 時, 不啟用下拉分頁
  if ($('#search-info').text()) return $(window).unbind('scroll')

  // document高 扣掉 視窗高 大約等於scrollBar拉到最底時的scrollY
  const bottom = $(document).height() - $(window).height()
  if ($(window).scrollTop() >= (bottom - 300) && flag === 0) {
    /*!
     * 期待結果為, scroll接近低部時, 僅執行一次 addUserData()
     * 但axios是ajax非同步加載, 新的html內容不會馬上產生, scrollBar不會立刻被往上推
     * 導致這個function在scroll滑下來瞬間會被多次觸發, 所以設個flag做判定
     * axios request的資料加載完之後, flag才會歸回0
     */
    flag++
    if (route === 'find') { putRandomUser(LIMIT) }
    if (route === 'following') { putUserData(LIMIT) }
  }

  // data 全數加載完, 移除 scroll 監聽器, 釋放資源
  if (route === 'find') {
    if (tempData.length === 0) { $(window).unbind('scroll') }
  }

  if (route === 'following') {
    const followingList = [...JSON.parse(sessionStorage.getItem('following'))]
    if (currentData.length === followingList.length) {
      $(window).unbind('scroll')
    }
  }
})