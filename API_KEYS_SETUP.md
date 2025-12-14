# API Keys Setup Guide

## 1. OpenAI API Key (You already have an account ✓)

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Give it a name (e.g., "Accent Coach")
4. Copy the key immediately (starts with `sk-`)

> **Note:** Make sure your account has access to GPT-4o. Check at https://platform.openai.com/settings/organization/limits

---

## 2. Azure Speech Services (New Account Setup)

### Step 1: Create Free Azure Account
1. Go to: https://azure.microsoft.com/free/
2. Click **"Start free"**
3. Sign in with Microsoft/GitHub/Google account
4. You'll get **$200 free credits** for 30 days + 12 months of free services

> **Tip:** Use the same email as your Microsoft account if you have one - faster setup.

### Step 2: Create Speech Resource (2 minutes)

1. Once logged into Azure Portal, go directly to:
   
   **https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices**

2. Fill in the form:
   | Field | Value |
   |-------|-------|
   | **Subscription** | Your subscription (auto-selected) |
   | **Resource group** | Click "Create new" → name it `accent-coach-rg` |
   | **Region** | `East US` (recommended) |
   | **Name** | `accent-coach-speech` (or any unique name) |
   | **Pricing tier** | `Free F0` (5 hours/month free) |

3. Click **"Review + create"** → then **"Create"**

4. Wait ~30 seconds for deployment

### Step 3: Get Your Keys

1. Click **"Go to resource"** (or find it in Resources)
2. In the left sidebar, click **"Keys and Endpoint"**
3. Copy:
   - **KEY 1** → This is your `AZURE_SPEECH_KEY`
   - **Location/Region** → This is your `AZURE_SPEECH_REGION` (e.g., `eastus`)

---

## 3. Add Keys to Your Project

Create the file `backend/.env`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
AZURE_SPEECH_KEY=xxxxxxxxxxxxx
AZURE_SPEECH_REGION=eastus
```

---

## Quick Reference

| Service | Free Tier | Link |
|---------|-----------|------|
| Azure Speech | 5 hours/month | [Create Resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices) |
| OpenAI | Pay-as-you-go (~$0.01/request) | [API Keys](https://platform.openai.com/api-keys) |

---

## Troubleshooting

**"Resource provider not registered"**
- Go to Subscriptions → Your subscription → Resource providers
- Search for `Microsoft.CognitiveServices` → Click Register

**"Quota exceeded"**  
- The Free F0 tier allows 5 hours of audio/month
- Upgrade to S0 ($1/hour) if needed

**Keys not working?**
- Make sure you copied KEY 1 (not the endpoint URL)
- Region should be lowercase, no spaces (e.g., `eastus` not `East US`)
