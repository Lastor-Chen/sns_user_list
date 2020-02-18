// ///////////////////////////
// 第三方 API 集中放置場
const userRequest = axios.create({
  baseURL: 'https://lighthouse-user-api.herokuapp.com/'
})
const indexPath = 'api/v1/users/'

const photoRequest = 'https://picsum.photos/'

// 變數宣告 
const dataPanel = document.querySelector('#data-panel')
let flag = 0  // 下方scroll監聽事件使用的flag

// Tools & 拆分 function
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max))
}
 
function setModalHtml(data, prop, size) {
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

function classToggle(target) {
  target.classList.toggle('btn-outline-primary')
  target.classList.toggle('btn-primary')
}
function classHide(method) {
  // 將 #data-Panel 的 children集合 從 Array-like 轉成 array。才能使用 .forEatch 迭代
  Array.from($(dataPanel).children())
    .forEach(item => {
      // 如 dataset.isFollow 為 false, 加入 classList hide
      $(item).attr('data-isFollow') === "true" ? null : item.classList[method]('hide')
    })
}

function countValue(selector, length) {
  $(`${selector} .nav-value`).attr('data-count', length)
}

// Main function
function addUserData(times) {
  userRequest.get(indexPath)
    .then(res => {
      const data = res.data.results

      // 批次匯入 data 至頁面, {times} = 次數
      // (user-api 有200筆資料, 一次拉下來感覺負擔過大, 所以設置需求次數)
      for (let i = 0; i < times; i++) {
        // 隨機產生index
        const index = getRandomInt(200)

        // 取得帳號字串 "xxxx@example.com" => "xxxx"
        const account = data[index].email.split('@')[0]

        const dataset = `data-toggle="modal" data-target="#modal" data-id="${data[index].id}"`
        const html = `
            <div class="card-top col-6 col-lg-4 col-xl-3 mb-4" data-isFollow="false">
              <div class="card">
                <div class="banner">
                  <img class="show-btn" src="${photoRequest}350/100?random=${index}" ${dataset}>
                </div>
                <div class="row pt-2">
                  <img class="avatar show-btn" src="${data[index].avatar}" alt="photo" ${dataset}>
                  <button class="btn btn-outline-primary btn-follow" type="button" data-follow="Follow" data-following="Following"></button>
                </div>
                <div class="card-body pl-3 pr-3">
                  <h5 class="card-title show-btn" ${dataset}>${data[index].name}</h5>
                  <h6 class="card-subtitle mb-2 text-muted">@<span class="show-btn" ${dataset}>${account}</span></h6>
                  <p class="card-text">Lorem ipsum dolor sit amet, consectetur adipisicing elit</p>
                </div>
              </div>
            </div>
          `
        dataPanel.innerHTML += html
      }

      // count數量, 顯示於 Navbar
      countValue('#nav-find', dataPanel.children.length)

      // request 完成後, 重設flag
      flag = 0
    })
}

function getModalContent(event) {
  // get Modal DOM
  const avatar = document.querySelector('#show-avatar')
  const info = document.querySelector('#show-info')

  // request user data from ".../api/v1/users/id"
  userRequest.get(`${indexPath}${event.target.dataset.id}`)
    .then(res => {
      const data = res.data

      // 製作html文字模板
      const arrKeys = ['name', 'gender', 'created_at', 'region', 'email']
      let template = ''
      for (let i = 0; i < arrKeys.length; i++) {
        // index偶數欄 col-lg-3, index奇數欄 col-lg-9
        if ((i % 2) === 0) { template += setModalHtml(data, arrKeys[i], 9) }
        else { template += setModalHtml(data, arrKeys[i], 3) }
      }

      // insert data into html
      avatar.src = res.data.avatar
      info.innerHTML = template
    })
}


// ///////////////////////////
// request user data 20筆, 生成初始頁面內容
addUserData(20)

// #data-Panel click事件監聽, 控制 Modal 內文資料
dataPanel.addEventListener('click', e => {

  // 生成user info, 加入至Modal
  if (e.target.matches('.show-btn')) {
    getModalContent(e)
  }

  // Follow按鈕class變換, ".btn-outline-primary 與 .btn-primary"
  // ps.這邊按鈕文字改用css偽類處理, 就不用操作 innerHTML 可少寫幾行JS
  if (e.target.matches('.btn-follow')) {
    classToggle(e.target)

    // 給目標最父層的 .card-top 打標記, 設定 dataset 的布林值
    let nowBoolean = $(e.target).parents('.card-top').attr('data-isFollow')  // 字串"false"
    nowBoolean = (nowBoolean === "true" ? true : false)  // 轉成布林false

    $(e.target).parents('.card-top').attr('data-isFollow', !nowBoolean )  // 用 ! 做toggle

    // count數量, 顯示於 Navbar
    const count = $('.card-top[data-isFollow = true]').length
    countValue('#nav-following', count)
  } 
})

// (jQuery實驗) scroll監聽, 到 bottom 時加入新 user data
$(window).on('scroll', e => {
  // (debug) 當前為Following頁面時return掉不執行, 否則會意外觸發addUserData()
  if ($('#nav-following')[0].matches('.active')) return

  // document高 扣掉 視窗高 大約等於scrollBar拉到最底時的scrollY
  const bottom = $(document).height() - $(window).height()

  if ( $(window).scrollTop() >= (bottom - 300) && flag === 0) {
    /*!
     * 期待結果為, scroll接近低部時, 僅執行一次 addUserData()
     * 但axios是ajax非同步加載, 新的html內容不會馬上產生, scrollBar不會立刻被往上推
     * 導致這個function在scroll滑下來瞬間會被多次觸發, 所以設個flag做判定
     * axios request的資料加載完之後, flag才會歸回0
     */
    flag++
    addUserData(20)
  }
})

// (jQuery實驗) navbar click監聽, 操作Following show/hide
$('.navbar-nav').click(e => {
  if ($(e.target).is('#nav-following')) {
    // 給非Folloing的 user card 加上 .hide
    classHide('add')
  }

  if ($(e.target).is('#nav-find')) {
    // 移除所有 .hide 顯示全部
    classHide('remove')
  }
})