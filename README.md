<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/190AP_P8gtauu0XoSwg1dJZPiOKOamCSx

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 待办优先级（换班/代理流程改造，面向微信文本派单）

- P0 必做
  - 前台表单补充线下必须信息：联系人姓名/手机号、集合点/上车点（接机需航站楼/到达口，接船需码头/闸口/集合点）、目的地/酒店、行李或特殊需求。
  - 提交后订单的修改/取消策略与留痕：允许更正关键字段，留审计；防止无痕改单。
  - 后台入口/权限隔离：隐藏或加简单登录开关，避免未授权访问。
- P1 应做
  - 估价规则明确说明 + 超额处理规则（预估仅用于授信/风控，超出需审批或二次确认）。
  - 派单模板（微信文本）分角色：司机版（集合点/联系人/人数车数/航班船号/备注）、统筹版（含结算方式、代理公司等）；前台数据对齐模板字段。
  - 票据元数据增强：票据号、供应商、开票日期/币种，避免重复报销，允许“先录后补票据”的宽限策略。
- P2 后续
  - 后端化存储与授信占用、对账单自动化、通知渠道（微信文本复制/链接）、权限矩阵。
  - 支持多设备查看订单（代理端）、订单状态机（待派单/已派单/执行中/已完成/已取消）。
