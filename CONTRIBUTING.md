# 貢獻指南

感謝您考慮為 Cert-Vote 做出貢獻！我們歡迎每個人的參與。參與此專案即表示您同意遵守我們的[行為準則](CODE_OF_CONDUCT.md)。

## 如何貢獻

### 回報問題

如果您發現錯誤或有功能請求，請[開啟一個 Issue](https://github.com/your-repo/cert-vote/issues)，並包括以下內容：
- 清晰且具描述性的標題。
- 重現問題的步驟（如果適用）。
- 預期行為與實際行為。
- 任何相關的截圖或日誌。

### 提交 Pull Request

1. Fork 此存儲庫並將其克隆到您的本地機器。
2. 為您的功能或錯誤修復創建一個新分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. 進行更改，確保您的代碼符合現有的風格和約定。
4. 徹底測試您的更改。
5. 使用描述性的提交訊息提交更改：
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. 將您的分支推送到您的 Fork 存儲庫：
   ```bash
   git push origin feature/your-feature-name
   ```
7. 向此存儲庫的 `main` 分支開啟一個 Pull Request。

### 代碼風格

此專案使用 ESLint 和 Prettier 進行代碼格式化。在提交 Pull Request 之前，請執行以下命令：
```bash
pnpm lint
```

### 文件

如果您的貢獻影響了 API 或面向使用者的功能，請更新 `docs/` 資料夾中的相關文件。

## 社群期望

- 保持尊重和包容。
- 提供建設性的反饋。
- 遵守[行為準則](CODE_OF_CONDUCT.md)。

## 需要幫助？

如果您有任何問題或需要協助，請隨時通過開啟 Issue 或加入我們的社群討論來聯繫我們。