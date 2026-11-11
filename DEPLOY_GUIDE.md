# 🚀 免本機安裝 npm · GitHub Actions 自動編譯與跨平台發布指南

你**完全不需要在本地安裝 Node.js 或執行 npm 指令**！只要把代碼推送（Push）到 GitHub，GitHub 免費的雲端伺服器（GitHub Actions）就會自動替你完成所有編譯、打包與部署。

---

## 📦 功能一：自動生成並下載 `game-portal-release.zip`

每次你向 GitHub 倉庫推送代碼（或在 GitHub 網頁上點擊運行）：

1. GitHub Actions 會自動啟動雲端虛擬機。
2. 自動執行 `npm install`、代碼審查與測試、編譯。
3. 自動將遊戲打包成符合各大平台規範的 `game-portal-release.zip`（`index.html` 位於根目錄，全相對路徑）。

### 📥 如何在 GitHub 網頁上下載產出的 ZIP 檔？
1. 打開你的 GitHub 專案倉庫頁面。
2. 點擊頂部的 **「Actions」** 標籤。
3. 點擊最近一次綠色打勾（Success）的運行記錄（例如 `Build Game Release & Deploy`）。
4. 滾動到頁面最下方的 **「Artifacts」** 區塊。
5. 點擊 **`game-portal-release`**，瀏覽器就會立即下載打包好的 ZIP 檔！
6. 將這個 ZIP 檔案直接上傳到 **CrazyGames**、**Y8** 或 **GamePix** 即可。

---

## 🌐 功能二：自動部署免費線上試玩版（GitHub Pages）

Workflow 已經內建將 `dist/` 自動發布為 GitHub Pages 免費靜態網站：

### 如何開啟 GitHub Pages（只需設定一次）：
1. 進入你的 GitHub 專案 ➡️ **Settings**（設定） ➡️ 側邊欄點擊 **Pages**。
2. 在 **Build and deployment** 下方的 **Source**，切換為 **「GitHub Actions」**。
3. 之後每次推代碼，你的遊戲就會自動更新在：  
   `https://<你的GitHub帳號>.github.io/<倉庫名稱>/`
4. 你可以直接把這個網址發給朋友試玩，或當作提交給平台的試玩 Demo！

---

## 🤖 功能三：是否可以直接自動部署到這些平台？

答案是：**可以！不同平台有專屬的自動化方式**：

### 1. GamePix（最輕鬆：零上傳、全自動同步）
- **運作原理**：GamePix 支援 **URL Hosting（網址託管模式）**。
- **做法**：
  1. 在 GamePix 開發者後台新增遊戲時，選擇 **「Host on your own server / Web link」**。
  2. 填入你的 GitHub Pages 網址（例如 `https://<你的帳號>.github.io/<倉庫>/`）。
  3. **完成！** 未來你在 GitHub 每次改代碼推送到 main，GitHub Actions 會自動更新 GitHub Pages，GamePix 就會**全自動抓取最新版本**，你連下載上傳 ZIP 都不需要！

### 2. CrazyGames（支援官方 CLI 密鑰自動上傳）
- **運作原理**：CrazyGames 提供了官方 `@crazygames/sdk-cli` 命令行工具。
- **做法**：
  1. 登入 [CrazyGames Developer Portal](https://developer.crazygames.com/)。
  2. 進入你的遊戲頁面，在設定中獲取 **API Access Token**。
  3. 在你的 GitHub 倉庫頁面：**Settings** ➡️ **Secrets and variables** ➡️ **Actions** ➡️ 點擊 **New repository secret**。
  4. Name 填寫：`CRAZYGAMES_TOKEN`，Secret 填入剛複製的 Token。
  5. **完成！** 今後 GitHub Actions 偵測到此 Secret，編譯完成後會自動調用 CrazyGames API 把 `game-portal-release.zip` 推送到 CrazyGames 審核/測試頻道！

### 3. Y8 Games
- 目前 Y8 官方後台主要採用網頁手動上傳 ZIP。
- 流程：直接在 GitHub 的 **Actions ➡️ Artifacts** 下載 `game-portal-release.zip`，然後拖入 Y8 Developer 後台即可，耗時不到 30 秒。

---

## 🛠️ 如何在 GitHub 網頁上手動一鍵觸發打包？
如果你沒有推新代碼，但想隨時生成最新的 ZIP：
1. 進入 GitHub 倉庫的 **Actions** 標籤。
2. 在左側列表點擊 **`Build Game Release & Deploy`**。
3. 點擊右側的 **「Run workflow」** 下拉按鈕，點擊綠色 **Run workflow**。
4. 約 30 秒後完成，即可在下方 Artifacts 下載最新 ZIP！
