/* global $ */

// ====================
// 引入公用項目
// ====================

// 載入API
import { userRequest, user_INDEX_URL, photoRequest, photo_INDEX_URL } from './lib.js'

// 載入公用變數
import { dataPanel, requestNum } from './lib.js'

// 載入公用function
import { countValue, getDefault, getUserHtml, getModalHtml, putModalData, classToggle, saveToCache } from './lib.js' 



// ====================
// 宣告
// ====================

let flag = 0  // 下方scroll監聽事件使用的flag
let currentData = []  // 存放頁面上, 當前存在的data, 供 mode切換 抓資料用

function putUserData(times) {
  // 計算要從cache中取出的資料範圍
  const followingList = [...JSON.parse(sessionStorage.getItem('following'))]
  const start = currentData.length

  const pickData = followingList.slice(start, start + times)

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

// 初始化頁面內容, 模擬後端Server, 重新整理後先抓取瀏覽器cache配置初始資料
getDefault()

// 取出瀏覽器cache, 刷新頁面
putUserData(requestNum)



// 監聽 #data-Panel click事件, 顯示user detail & 設置follow btn
dataPanel.addEventListener('click', e => {
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
  const regex = new RegExp(inputValue, 'i')

  // 從API server過濾資料
  userRequest.get(user_INDEX_URL)
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

// 監聽 window scroll事件, 到 bottom 時加入新 user data
$(window).on('scroll', () => {
  // 此專案希望忽略search頁的scroll監聽
  // Search結果頁時, return掉, 並移除scroll監聽
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
    putUserData(requestNum)
  }

  // 如資料全數加載進頁面, 移除scroll監聽器, 釋放資源
  const followingList = [...JSON.parse(sessionStorage.getItem('following'))]
  if (currentData.length === followingList.length) {
    $(window).unbind('scroll')
  }
})