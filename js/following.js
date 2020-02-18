/* global $, axios */

// ====================
// 第三方 API 集中放置場
// ====================
const userRequest = axios.create({
  baseURL: 'https://lighthouse-user-api.herokuapp.com/'
})
const user_INDEX_URL = 'api/v1/users/'

const photoRequest = 'https://picsum.photos/'
const photo_INDEX_URL = '350/100?random='

// ====================
// 宣告
// ====================
const dataPanel = document.querySelector('#data-panel')

const requestNum = 24  // 單次需求數
let flag = 0  // 下方scroll監聽事件使用的flag

let currentData = []  // // 存放頁面上, 當前存在的data, 供 mode切換 抓資料用

///////////////////////////
// Tools
function countValue(selector, length) {
  $(`${selector} .nav-value`).attr('data-count', length)
}

function getDefault() {
  // 從cache, 配置顯示模式 'mode', 如無資料, 則設為card
  const mode = sessionStorage.getItem('mode') || 'card'
  dataPanel.dataset.mode = mode
  $(`[data-mode=${mode}]`).toggleClass('active')

  // 從cache, 配置 'following', 如無資料, 則打上初始值
  try {
    const count = JSON.parse(sessionStorage.getItem('following')).length
    countValue('#nav-following', count)
  } catch (error) {
    countValue('#nav-following', 0)

    // 先給上Array型別, 防止有用cache做陣列方法的地方報錯
    sessionStorage.setItem('following', '[]')
  }
}

///////////////////////////
// 生成頁面內容相關
function getUserHtml(data, mode) {
  let html = ''
  let num = 0  // photoRequest序列號

  const cache = JSON.parse(sessionStorage.getItem('following'))

  if (mode === 'card') {
    data.forEach(user => {
      // 取得帳號字串 "xxxx@example.com" => "xxxx"
      const account = user.email.split('@')[0]

      // cache中存在, 表示是Following user, 給予對應樣式
      const style = cache.some(item => item.id === user.id) ? 'btn-primary' : 'btn-outline-primary'

      const dataset = `data-toggle="modal" data-target="#modal" data-id="${user.id}"`
      html += `
        <div class="card-top col-6 col-lg-4 col-xl-3 mb-4">
          <div class="card">
            <div class="banner">
              <img class="show-modal" src="${photoRequest}${photo_INDEX_URL}${num}" ${dataset}>
            </div>
            <div class="row pt-2">
              <img class="avatar show-modal" src="${user.avatar}" alt="photo" ${dataset}>
              <button class="btn ${style} btn-follow" type="button" data-follow="Follow" data-following="Following" data-id="${user.id}"></button>
            </div>
            <div class="card-body pl-3 pr-3">
              <h5 class="card-title show-modal" ${dataset}>${user.name}</h5>
              <h6 class="card-subtitle mb-2 text-muted">@<span class="show-modal" ${dataset}>${account}</span></h6>
              <p class="card-text">Lorem ipsum dolor sit amet, consectetur adipisicing......</p>
            </div>
          </div>
        </div>
      `

      num++
    })
  }

  if (mode === 'list') {
    data.forEach(user => {
      // 取得帳號字串 "xxxx@example.com" => "xxxx"
      const account = user.email.split('@')[0]

      // cache中存在, 表示是Following user, 給予對應樣式
      const style = cache.some(item => item.id === user.id) ? 'btn-primary' : 'btn-outline-primary'

      const dataset = `data-toggle="modal" data-target="#modal" data-id="${user.id}"`
      html += `
        <div class="col-12 d-flex border-top border-secondary p-2 align-items-center">
          <h6 class="col-2 col-xl-2 mb-0 show-modal" ${dataset}>${user.name}</h6>
          <h6 class="col-3 col-xl-2 mb-0 text-muted">@<span class="show-modal" ${dataset}>${account}</span></h6>
          <p class="col-5 col-xl-5 mb-0">Lorem ipsum dolor sit amet, consectetur adipisicing......</p>
          <div class="col-2 col-xl-3">
            <button class="btn ${style} btn-follow" type="button" data-follow="Follow" data-following="Following" data-id="${user.id}"></button>
          </div>
        </div>
      `
    })
  }

  return html
}

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

function getModalHtml(data, prop, size) {
  let template = `<div class="col-12 col-lg-${size} mb-2 icon-${prop}">${data[prop]}</div>`

  // name跟created_at規格不一樣, 獨立處理
  if (prop === 'name') { template = `<div class="col-12 h5">${data[prop]} ${data.surname}</div>` }
  if (prop === 'created_at') {
    // 處理 ISO 8601 時間資料 "2019-02-16T14:12:05.967Z"
    const joinedDate = new Date(data[prop])
    const option = { year: 'numeric', month: 'short', day: 'numeric' }
    const showDate = joinedDate.toLocaleDateString('en', option)

    template = `<div class="col-12 col-lg-${size} mb-2 icon-${prop}">Joined ${showDate}</div>`
  }

  return template
}

function putModalData(event) {
  // 先隱藏img欄位, 防止API資料抓太慢, 用戶會看到上一筆圖片
  $('#show-avatar').attr('hidden', true)

  // request user data from API by user id
  userRequest.get(`${user_INDEX_URL}${event.target.dataset.id}`)
    .then(res => {
      const data = res.data

      // 製作html文字模板
      const arrKeys = ['name', 'gender', 'created_at', 'region', 'email']
      let template = ''
      for (let i = 0; i < arrKeys.length; i++) {
        // index偶數欄 col-lg-3, index奇數欄 col-lg-9
        if ((i % 2) === 0) { template += getModalHtml(data, arrKeys[i], 9) }
        else { template += getModalHtml(data, arrKeys[i], 3) }
      }

      // insert data into html
      $('#show-avatar').attr('src', res.data.avatar)
      $('#show-info').html(template)

      // 顯示圖片欄位
      $('#show-avatar').attr('hidden', false)
    })
}

///////////////////////////
// Following功能相關
function classToggle(target) {
  target.classList.toggle('btn-outline-primary')
  target.classList.toggle('btn-primary')
}

function saveToCache(user) {
  // 取出瀏覽器緩存
  let list = JSON.parse(sessionStorage.getItem('following'))

  if (list.some(item => item.id === user.id)) {
    // 如已經存在, 從list中移除
    list = list.filter(value => value.id !== user.id)
  } else {
    // 如不存在, 加入list
    list.push(user)
  }

  sessionStorage.setItem('following', JSON.stringify(list))
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