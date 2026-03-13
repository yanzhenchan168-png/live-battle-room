# GitHub SSH 密钥配置

## 已生成的 SSH 密钥

**公钥内容**（需要添加到 GitHub）：
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH8fd/q2MdDn2rmlehGbBoRzRq2lxKRvnnnveMUtukYy deploy@live-battle-room
```

## 添加密钥到 GitHub

### 步骤 1：访问 GitHub 设置
1. 访问：https://github.com/settings/keys
2. 点击 **"New SSH key"** 按钮

### 步骤 2：添加密钥
1. **Title**: 输入 `live-battle-room-deploy`
2. **Key**: 粘贴上面的公钥内容
3. 点击 **"Add SSH key"**

### 步骤 3：确认添加
- 如果需要，输入 GitHub 密码验证

## 完成后

返回终端，执行以下命令继续推送：

```bash
cd /workspace/projects/live-battle-room
git push -u origin main
```

## 如果遇到问题

### 问题 1：仍然提示权限错误

解决方案：
1. 确认公钥已正确添加到 GitHub
2. 检查密钥权限：
   ```bash
   chmod 600 ~/.ssh/github_deploy
   chmod 644 ~/.ssh/github_deploy.pub
   ```

### 问题 2：密钥已添加但仍失败

解决方案：
- 确保使用的是 **Deploy keys** 或 **SSH and GPG keys**
- 而不是其他类型的密钥

## 后续操作

添加密钥成功后，推送命令会自动执行，代码将上传到：

```
https://github.com/yanzhenchan168-png/live-battle-room
```

## 自动部署

推送成功后，你可以：
1. 在 Vercel 导入这个仓库
2. 自动部署应用
3. 获得正式的访问地址
