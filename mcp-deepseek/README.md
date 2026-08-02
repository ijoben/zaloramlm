# DeepSeek MCP Server untuk Antigravity IDE

Server MCP ini menghubungkan **DeepSeek AI API** ke **Antigravity IDE**, sehingga Anda bisa menggunakan model DeepSeek langsung sebagai tools dalam percakapan.

## 📦 Instalasi

```bash
cd mcp-deepseek
npm install
```

## 🔑 Konfigurasi API Key

Dapatkan API Key dari: https://platform.deepseek.com/api_keys

API Key akan dikonfigurasi langsung di MCP Config (lihat bagian Setup di bawah).

## 🛠️ Setup di Antigravity IDE

Buka file `C:\Users\Hp\.gemini\config\mcp_config.json` dan tambahkan konfigurasi berikut:

```json
{
  "mcpServers": {
    "deepseek": {
      "command": "node",
      "args": ["c:/KLIEN 2026/HEDTRO.COM/zaloramlm/mcp-deepseek/index.js"],
      "env": {
        "DEEPSEEK_API_KEY": "sk-GANTI_DENGAN_API_KEY_ANDA"
      }
    }
  }
}
```

> **Penting**: Ganti `sk-GANTI_DENGAN_API_KEY_ANDA` dengan API Key DeepSeek Anda yang sebenarnya.

## 🤖 Tools yang Tersedia

| Tool | Model | Kegunaan |
|------|-------|----------|
| `deepseek_chat` | DeepSeek-V3 | Chat umum, konten, Q&A |
| `deepseek_code` | DeepSeek-R1 | Coding kompleks, reasoning |
| `deepseek_analyze` | DeepSeek-V3 | Code review, security audit |
| `deepseek_models` | - | Lihat daftar model & status |

## 💡 Contoh Penggunaan di Antigravity

Setelah setup, Anda bisa meminta Antigravity:

- *"Gunakan deepseek_code untuk debug fungsi ini..."*
- *"Pakai deepseek_chat untuk translate konten ini..."*
- *"Jalankan deepseek_analyze dengan security_audit untuk kode ini..."*

## 🧪 Test Koneksi

```bash
# Test manual (akan menunggu input JSON via stdin)
node index.js
```

## 📊 Harga DeepSeek (2025)
- DeepSeek-V3: $0.27/juta token input, $1.10/juta token output
- DeepSeek-R1: $0.55/juta token input, $2.19/juta token output

Sangat terjangkau dibanding OpenAI GPT-4!
