"""
Smart rule-based LLM provider with detailed, context-aware fraud/scam responses.
Falls back to real Gemini API if GEMINI_API_KEY + LLM_PROVIDER=gemini is set.
"""
import os
import re
from typing import Optional


# ── Knowledge base of scam types and their detailed responses ──────────────────
FRAUD_KNOWLEDGE = {
    "digital_arrest": {
        "keywords": ["digital arrest", "police arrest", "cybercrime officer", "virtual arrest", "online arrest", "ips officer", "cbi officer"],
        "response": """🚨 **This is a DIGITAL ARREST SCAM!**

**What's happening:** Scammers are pretending to be CBI/Police/Customs officers and threatening you with a fake "digital arrest" to extort money.

**Key facts:**
- ❌ There is NO such thing as "Digital Arrest" in Indian law
- ❌ Real police NEVER demand money over video/phone calls  
- ❌ No legitimate authority will ask you to stay on a video call

**Immediate actions:**
1. 🔴 Hang up immediately — do NOT engage further
2. 📞 Call the **National Cyber Crime Helpline: 1930**
3. 🌐 File a report at **cybercrime.gov.in**
4. 🏦 Alert your bank if you've shared any financial details
5. 📷 Screenshot/record any messages as evidence

**Remember:** Real government agencies send written notices, not WhatsApp calls."""
    },
    "upi_fraud": {
        "keywords": ["upi", "gpay", "phonepe", "paytm", "qr code", "scan to receive", "collect request"],
        "response": """⚠️ **UPI Fraud Alert!**

**Golden Rule of UPI:** You NEVER need to enter your PIN to RECEIVE money. If someone asks you to scan a QR code or enter PIN to receive payment — it's a SCAM.

**Common UPI scams:**
- "Scan this QR to get refund" → Actually charges you
- "Accept money collect request" → Drains your account  
- "Send ₹1 to verify, get ₹10,000 back" → Advance fee fraud

**Immediate steps if you've been scammed:**
1. 📞 Call your bank helpline immediately (24/7)
2. 📞 Helpline: **1930** (National Cyber Crime)
3. 🚫 Block the scammer's number
4. 🌐 Report at: cybercrime.gov.in

**Evidence to preserve:** Screenshots of all messages, transaction IDs, scammer's contact."""
    },
    "phishing_url": {
        "keywords": ["link", "url", "website", "click", "http", "www", ".tk", ".ml", ".xyz", "suspicious link", "phishing"],
        "response": """🔗 **Suspicious Link / Phishing Warning!**

**How to identify phishing links:**
- ✅ Official: `www.sbi.co.in` ← Legitimate
- ❌ Fake: `sbi-kyc-update.ml` or `sbilogin.xyz` ← Phishing

**Red flags in URLs:**
- Extra hyphens: `hdfc-bank-kyc.com`
- Wrong TLD: `.tk`, `.ml`, `.xyz`, `.ga` instead of `.in` or `.com`
- Extra words: `paytm-urgent-kyc.net`
- HTTP instead of HTTPS

**If you clicked a suspicious link:**
1. 🔒 Do NOT enter any login credentials
2. 🔄 Change passwords immediately for any site you logged into
3. 📞 Call bank if you entered financial details
4. 🛡️ Run a virus scan on your device
5. 📢 Report phishing URLs to: **report.phishing@cert-in.org.in**"""
    },
    "otp_fraud": {
        "keywords": ["otp", "one time password", "verification code", "shared otp", "gave otp"],
        "response": """🚨 **OTP Shared? Act IMMEDIATELY!**

OTPs (One-Time Passwords) are like a key to your bank account. **Never share them with anyone** — not even bank employees.

**If you've already shared your OTP:**

⏱️ **Within 3 days = Zero liability under RBI rules (if reported quickly)**

**Act NOW (in this order):**
1. 📞 **Call your bank IMMEDIATELY** — ask to block the transaction
2. 🔒 Login to net banking and change your password
3. 📞 Call **1930** — National Cyber Crime Helpline
4. 🌐 File FIR at: **cybercrime.gov.in**
5. 📧 Email your bank's fraud team with all details

**RBI Mandate:** Banks must refund unauthorized transactions reported within 3 working days (zero liability), within 4-7 days (limited liability)."""
    },
    "loan_fraud": {
        "keywords": ["loan", "instant loan", "pre-approved", "processing fee", "loan app", "advance fee"],
        "response": """💰 **Loan App / Advance Fee Fraud Warning!**

**This is a scam if:**
- They ask for "processing fee" before disbursing the loan
- Loan is "pre-approved" without any credit check
- They ask for access to your contacts/photos
- Interest rate seems too good to be true

**Legitimate lenders NEVER:**
- Ask for upfront fees before loan disbursement
- Harass your contacts if you miss a payment
- Demand gift cards or crypto as payment

**If targeted by illegal loan apps:**
1. 📞 RBI helpline: **14440**
2. 🌐 Report illegal lending apps: **sachet.rbi.org.in**
3. 📞 Cyber Crime: **1930**
4. 🚫 Do NOT pay any "processing fees"

**Verify before borrowing:** Check RBI's list of registered NBFCs at rbi.org.in"""
    },
    "counterfeit_currency": {
        "keywords": ["fake note", "counterfeit", "fake currency", "fake rupee", "fake 500", "fake 2000"],
        "response": """💵 **Counterfeit Currency Detection Guide**

**How to verify Indian currency notes:**

**₹500 & ₹2000 notes — check these features:**
1. 🔒 **Security thread** — embedded strip that glows under UV light
2. 💧 **Watermark** — Mahatma Gandhi portrait visible when held to light
3. 🔢 **Color-shifting ink** — numeral changes color when tilted
4. 📝 **Micro-lettering** — "RBI" and "भारत" visible under magnification
5. ✅ **Intaglio printing** — raised print you can feel with fingers

**If you receive a suspected fake note:**
1. 🏦 Take it to the nearest bank branch — do NOT use it
2. 🚫 Don't return it to the person who gave it
3. 👮 Bank will forward to police — you're legally protected
4. 📞 Report: **1930** if you suspect organized counterfeiting

**Use SurakshaAI's Currency Scanner** to analyze any note in seconds!"""
    },
    "investment_fraud": {
        "keywords": ["investment", "stock tips", "crypto", "bitcoin", "guaranteed returns", "double money", "trading"],
        "response": """📈 **Investment Fraud / Ponzi Scheme Warning!**

**It's a scam if they promise:**
- "Guaranteed 50% returns in 30 days"
- "SEBI-registered expert tips" (verify at sebi.gov.in)
- Crypto schemes promising 10x returns
- Asking you to recruit others for extra income

**SEBI-registered investment advisors can be verified at:**
🌐 **sebi.gov.in → Intermediaries → Investment Advisers**

**If you've lost money:**
1. 📞 SEBI helpline: **1800-266-7575** (free)
2. 🌐 File complaint: **scores.sebi.gov.in**
3. 📞 Cyber Crime: **1930**
4. 🏦 Contact your bank to reverse unauthorized transactions

**Remember:** No legitimate investment guarantees fixed returns. If it sounds too good to be true — it IS a scam."""
    },
    "general": {
        "keywords": [],
        "response": """🛡️ **SurakshaAI Fraud Prevention Assistant**

I'm here to help you stay safe from cyber fraud! Here's what I can help with:

**🔍 Quick checks I can perform:**
- Analyze suspicious URLs for phishing
- Evaluate scam call transcripts
- Identify fraud SMS/messages
- Guide on reporting cyber crimes

**📞 Emergency Helplines:**
| Helpline | Number |
|----------|--------|
| National Cyber Crime | **1930** |
| RBI Banking Fraud | **14440** |
| SEBI Investor | **1800-266-7575** |
| Police Emergency | **100** |

**🌐 Report Online:**
- Cyber Crime: cybercrime.gov.in
- Bank Fraud: RBI Sachet: sachet.rbi.org.in
- SEBI Fraud: scores.sebi.gov.in

**What specific concern do you have?** Describe your situation and I'll guide you with precise advice."""
    }
}


class LLMProvider:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "smart_mock")
        if self.provider == "gemini":
            try:
                import google.generativeai as genai  # type: ignore
                genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
                self.model = genai.GenerativeModel("gemini-1.5-flash")
                self._gemini = genai
            except Exception:
                self.provider = "smart_mock"
                self.model = None

    def _classify_fraud_type(self, message: str) -> str:
        msg_lower = message.lower()
        for fraud_type, data in FRAUD_KNOWLEDGE.items():
            if fraud_type == "general":
                continue
            if any(kw in msg_lower for kw in data["keywords"]):
                return fraud_type
        return "general"

    def generate_response(self, prompt: str, context: str = "") -> str:
        if self.provider == "gemini":
            try:
                system_prompt = (
                    "You are SurakshaAI, an expert Indian cyber fraud prevention assistant. "
                    "You help citizens identify and report digital fraud, scams, phishing, "
                    "counterfeit currency, UPI fraud, and digital arrest scams. "
                    "Always respond in clear, actionable language with specific Indian helpline numbers. "
                    "Use markdown formatting with emojis for clarity. "
                    "Include relevant helpline numbers (1930, 14440, cybercrime.gov.in).\n\n"
                )
                if context:
                    system_prompt += f"Relevant context:\n{context}\n\n"
                full_prompt = system_prompt + f"User query: {prompt}"
                response = self.model.generate_content(full_prompt)
                return response.text
            except Exception as e:
                pass  # Fall through to smart_mock

        # Smart rule-based response
        fraud_type = self._classify_fraud_type(prompt)
        return FRAUD_KNOWLEDGE[fraud_type]["response"]
