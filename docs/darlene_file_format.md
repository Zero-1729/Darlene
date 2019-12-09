# Darlene Files

> **Warn**: The Darlene file structure is still experimental, and subject to change!

## File Extension

Darlene files carry the '`.drln`' file extension

## Structure of '.drln' Files

A darlene file is a binary file that contains the following information

| Content | (Memory) Location | Info/Purpose |
|---------|-------------------|---------|
| (File) Version | First byte | Version number determines the AES mode. I.e. `< 01 >` (`v1`) -> `CBC` and `< 02 >` (`v2`) -> `GCM`<br><br>Both modes use a random `IV`. |
| (AES) Key Length | Second byte | To allow any file parser easily make out the key size for creating the key.<br><br>Value of `< 7f >` (`128`), `< bf >` (`192`), or `< ff >` (`256`). |
| Encoding | Next 3 bytes | Hash encoding.<br><br>**Note**: Hex -> `< 68 65 78 >` (utf8 string '`hex`') & Base64 -> `< 62 36 34 >` (utf8 string `b64`) |
| Flag | next byte | Describes whether the contents is a list of hashes or a single hash.<br><br>**Note**: `< 00 >` (`0`) means its a single hash, and `< 01 >` (`1`) means its a list of hashes |
| Hashes length | next 2 bytes | Optional, max count is 255 (`< 00 >` - `< ff >`)<br><br>Only available if the flag is set. Total length of encrypted hashes<br><br>**Note**: Darlene assumes that the length of hashes are equal. So she would read the entire chunk of hashes then split it into `hash_length` *equal* parts. |
| Initialization Vector (`iv`) | Next 16 bytes | - |
| Encrypted Content | Remaining bytes, after first 24 bytes and before last 21 bytes | Actual encrypted text.<br><br>**Note**: First byte determines whether encrypted content is a plain string or encrypted JSON. If the byte is set to  '1' (`< 01 >`) then we know it is a JSON, else if it is unset (`< 00 >`), then it is just a plain string |
| Tag | next 16 - 32 bytes | Tag from `GCM` mode if version byte -> `< 02 >` (`v2`)<br><br>`Hmac('sha256')` for `CBC` if version byte -> `< 01 >` (`v1`)<br><br>To be used as the Checksum, for file integrity check.<br><br>**Note**: The tag is a full 32 char hex in 'cbc' mode and a shorter 16 char hex in 'gcm' mode |
| Extension | last 5 bytes | Original file extension of encrypted file, to be used when decrypting a darlene file.<br><br>**Note**: Optional |

## AES mode info

| Version | AES Mode | Supported key lengths | Authenticated | Authentication Datum |
|---------|----------|-----------------------|---------------|--|
| `v1` | CBC | 128, 192, 256 | YES | (`Hmac`) Tag |
| `v2` | GCM | 128, 192, 256 | YES | Tag |
