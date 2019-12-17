# Darlene

A Symmetric Encryption Toolchain.

---

**Note**: When Darlene encrypts some piece of data, be it a text/binary file, array, string/JSON or Buffer, it outputs a [darlene](./docs/darlene_file_format.md) file. 

This allows Darlene preserve the necessary metadata for decrypting the data later on.

---

- Darlene can Encrypt/Decrypt:
    - [x] JSON
    - [x] String
    - [x] Buffer
    - [x] Arrays
    - [x] Plain Text & Binary files

---

# Install

## Node repo

```sh
npm install -g darlene
```

## Locally

```sh
# Clone repo from GitHub
git clone https://github.com/Zero-1729/Darlene

# Enter folder and give proper executable access to cli file
cd Darlene && npm run prepare

# Gloabally install cli package 
npm install -g . 

# Note: If you get an 'EACCES' error run the command below instead
sudo npm install -g . --unsafe-perm=true --allow-root
```

# Uninstall

## Node repo

```sh
npm uninstall -g darlene
```

## Locally

```sh
npm uninstall -g .

# Note: If you get an 'EACCES' error run the command below instead
sudo npm install -g . --unsafe-perm=true --allow-root
```

---

MIT &copy; 2019 (Zero1729)
