# 簡易社群名單

主要為學習 AJAX 概念，並使用前端打 API 的練習作。<br>

仿照 Twitter / LinkedIn 等社群平台，將 Users 資源 list 在頁面上。<br>
並練習 follow / unfollow 等功能該如何實作。

成品Demo - [Github Pages](https://lastor-chen.github.io/sns_user_list/)

## 功能
- 瀏覽
  - 可使用 Find 功能，隨機尋找 Users，拓展人脈
  - 可使用關鍵字搜尋 User name
  - 點擊 User Card 可於 pop-up viewer 顯示詳細情報
  - 可切換 Card / List，兩種 view mode
- 可以 Follow / unFollow 其他 User
- 點擊 Following，可以檢視追隨中的 User


## 練習目標
#### 主要目標
- 使用 axios 打 API
- 閱讀 API 文件

#### 延伸練習
- search 功能
- 參考 Twitter，美化 UI
- 研究無限下拉式分頁
- 切換 view mode 功能
- follow / unfollow 功能
  - 利用 DOM show / hide 的技巧來模擬此功能 (舊版)
  - 利用瀏覽器 Storage 模擬後端資料庫 (新版)
- 學習使用 ES6 module 拆分 function
  
## 使用技術
|      | 項目 | 項目 |    項目     |
|------|------|------|------------|
| 前端 | HTML5 | CSS3 | JavaScript |
| 技術 | RWD   | ES6 module | AJAX |
| 框架 | jQuery | axios | Bootstrap |

<br>

|        | API資訊 |
|--------|--------|
| Users data  | Alpha Camp 教學用 API |
| banner images | [Lorem Picusum](https://picsum.photos/) |