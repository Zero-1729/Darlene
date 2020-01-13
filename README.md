# Darlene

A Symmetric Encryption Tool.

---

**Note**: When Darlene encrypts some piece of data, be it a text/binary file, array, string/JSON or Buffer, it outputs a [darlene](./docs/darlene_file_format.md) file. 

This allows Darlene preserve the necessary metadata for decrypting the data later on.

---

> **Tip**: After decrypting, remember to convert back to `Buffer`; hex/base64 string is returned. 
> 
> Check [the sample code](./examples/buffer/buffer.js) for more info.

- Darlene can Encrypt/Decrypt:
    - [x] JSON
    - [x] String
    - [x] Buffer
    - [x] Arrays (using JSON)
    - [x] Plain Text & Binary files

---

# Install CLI

## NPM

```sh
npm install -g darlene

# Note: If you get an 'EACCES' error run the command below instead
sudo npm install -g . --unsafe-perm=true --allow-root
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

## NPM

```sh
npm uninstall -g darlene

# Note: If you get an 'EACCES' error run the command below instead
sudo npm install -g . --unsafe-perm=true --allow-root
```

## Locally

```sh
npm uninstall -g .

# Note: If you get an 'EACCES' error run the command below instead
sudo npm install -g . --unsafe-perm=true --allow-root
```

---

MIT &copy; 2019 (Zero1729)
