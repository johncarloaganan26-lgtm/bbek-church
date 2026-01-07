import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Custom styles to ensure error messages are red
const customStyles = `
  /* Force error messages to be red */
  .el-message--error {
    background-color: #ffebee !important;
    border: 1px solid #ef5350 !important;
    border-radius: 4px !important;
  }
  .el-message--error .el-message__content {
    color: #c62828 !important;
    font-weight: 600 !important;
  }
  .el-message--error .el-message-icon.el-icon {
    color: #c62828 !important;
  }
  .el-message--error .el-message__closeBtn {
    color: #c62828 !important;
  }
  
  /* Force warning messages to be amber */
  .el-message--warning {
    background-color: #fff8e1 !important;
    border: 1px solid #ffc107 !important;
    border-radius: 4px !important;
  }
  .el-message--warning .el-message__content {
    color: #f57c00 !important;
    font-weight: 600 !important;
  }
  .el-message--warning .el-message-icon.el-icon {
    color: #f57c00 !important;
  }
  
  /* Force success messages to be green */
  .el-message--success {
    background-color: #e8f5e9 !important;
    border: 1px solid #66bb6a !important;
    border-radius: 4px !important;
  }
  .el-message--success .el-message__content {
    color: #2e7d32 !important;
    font-weight: 600 !important;
  }
  .el-message--success .el-message-icon.el-icon {
    color: #2e7d32 !important;
  }
  
  /* Force info messages to be blue */
  .el-message--info {
    background-color: #e3f2fd !important;
    border: 1px solid #42a5f5 !important;
    border-radius: 4px !important;
  }
  .el-message--info .el-message__content {
    color: #1565c0 !important;
    font-weight: 600 !important;
  }
  .el-message--info .el-message-icon.el-icon {
    color: #1565c0 !important;
  }
`

// Inject custom styles
const styleSheet = document.createElement('style')
styleSheet.textContent = customStyles
document.head.appendChild(styleSheet)

export default {
  install(app) {
    app.use(ElementPlus)
    // Register all icons
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }
  }
}
