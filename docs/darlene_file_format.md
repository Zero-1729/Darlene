# Darlene Files

> **Warn**: The Darlene file structure is still experimental, and thus subject to change!

## File Extension

Darlene files carry the '`.drln`' file extension

## AES mode info

| Version | AES Mode | Supported key lengths | Authenticated | Authentication Datum |
|---------|----------|-----------------------|---------------|--|
| `v1` | CBC | 128, 192, 256 | YES | (`Hmac`) Tag |
| `v2` | GCM | 128, 192, 256 | YES | Tag |

## Structure of '`drln`' Files

A darlene file is a binary file that contains the following information

**Note**: After version 0.6.x, the drln file structure was changed to the sturtuce below to make reading the data easier. If you are reading  fdrln files created by older versions of `darlene` (v0.5.x or older) scroll down to the [legacy format](###Legacy\ format) section.

### Current format

**Note**: This is the structure used by `darlene` version 0.6.x or newer.

| Content | (Memory) Location | Info/Purpose | Section |
|---------|-------------------|---------|----------|
| Magic Number | First 4 bytes | Constant integer ('`44 4E 17 29`') to indicate the start of a drln file. | Tip |
| (File) Version | Next byte | Version number determines the AES mode. I.e. `< 01 >` (`v1`) -> `CBC` and `< 02 >` (`v2`) -> `GCM`<br><br>Both modes use a random `IV`. | Header |
| (AES) Key Length | Next byte | To allow any file parser easily make out the key size for creating the key.<br><br>Value of `< 7f >` (`128`), `< bf >` (`192`), or `< ff >` (`256`). | Header |
| Initialization Vector (`iv`) | Next 16 bytes | - | Header |
| Tag | Next 16 - 32 bytes | Tag from `GCM` mode if version byte -> `< 02 >` (`v2`)<br><br>`Hmac('sha256')` for `CBC` if version byte -> `< 01 >` (`v1`)<br><br>To be used as the Checksum, for file integrity check.<br><br>**Note**: The tag is a full 32 char hex in 'cbc' mode and a shorter 16 char hex in 'gcm' mode | Header |
| Encoding | Next 3 bytes | Hash encoding.<br><br>**Note**: Hex -> `< 68 65 78 >` (utf8 string '`hex`') & Base64 -> `< 62 36 34 >` (utf8 string `b64`) | Header |
| File Extension | Next 5 bytes | Original file extension of encrypted file, to be used when decrypting a darlene file.<br><br>To save space, the extension is stored without the prepended dot. I.e. `png` not `.png`.<br><br>**Note**: Defaults to `< 74 78 74 00 00 >` (`txt`). | Header |
| Encrypted Content | Remaining bytes: after the magic number and drln header (46 - 62 bytes) | Actual encrypted text.<br><br>**Note**: First byte determines the encrypted content type: binary, JSON or plain text.<br><br>If the content is binary the value is set to `< 02 >`, `< 01 >` if its JSON and left empty (`< 00 >` if its plain text. | Body |

### Legacy format

**Note**: This is the structure used by `darlene` version 0.5.x or older.

| Content | (Memory) Location | Info/Purpose |
|---------|-------------------|---------|
| (File) Version | First byte | Version number determines the AES mode. I.e. `< 01 >` (`v1`) -> `CBC` and `< 02 >` (`v2`) -> `GCM`<br><br>Both modes use a random `IV`. |
| (AES) Key Length | Second byte | To allow any file parser easily make out the key size for creating the key.<br><br>Value of `< 7f >` (`128`), `< bf >` (`192`), or `< ff >` (`256`). |
| Encoding | Next 3 bytes | Hash encoding.<br><br>**Note**: Hex -> `< 68 65 78 >` (utf8 string '`hex`') & Base64 -> `< 62 36 34 >` (utf8 string `b64`) |
| Initialization Vector (`iv`) | Next 16 bytes | - |
| Encrypted Content | Remaining bytes: after first 21 bytes and before last 21 - 37 bytes | Actual encrypted text.<br><br>**Note**: First byte determines the encrypted content type: binary, JSON or plain text.<br><br>If the content is binary the value is set to `< 02 >`, `< 01 >` if its JSON and left empty (`< 00 >` if its plain text. |
| Tag | next 16 - 32 bytes | Tag from `GCM` mode if version byte -> `< 02 >` (`v2`)<br><br>`Hmac('sha256')` for `CBC` if version byte -> `< 01 >` (`v1`)<br><br>To be used as the Checksum, for file integrity check.<br><br>**Note**: The tag is a full 32 char hex in 'cbc' mode and a shorter 16 char hex in 'gcm' mode |
| File Extension | last 5 bytes | Original file extension of encrypted file, to be used when decrypting a darlene file.<br><br>To save space, the extension is stored without the prepended dot. I.e. `png` not `.png`.<br><br>**Note**: Defaults to `< 74 78 74 00 00 >` (`txt`). |