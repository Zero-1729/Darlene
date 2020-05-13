# Darlene

A Symmetric Encryption Tool.

![darlene](./darlene.png)

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

> **Note**: Ensure to include the binary flag (`-B`) when working with binary files, usually these are files that display garbage data when opened in a text editor, e.g. '.png', '.pdf', '.docx', '.exe', '.AppImage', etc.

> **Caution**: If you are decrypting binary content that requires exec (`+x`) permissions then include the `-X` or `--exec` flag. You could also use the flag if you aren't sure whether the binary content being decrypted would require exec (`+x`) permissions.

---

# Upgrading from version 0.6.x

After the `v0.6.0` release, the [drln file structure](./docs/darlene_file_format.md) was changed to make reading the drln data easier and also make discovery of drln files easier, as they now begin with the 4 Byte magic number '`44 4E 17 29`'.

If you are trying to decrypt an older drln file created by `darlene` v0.5.x or older, include the `-legacy` or `-L` flag.

# Install CLI

## NPM

```sh
npm install -g darlene

# Note: If you get an 'EACCES' error run the command below instead
sudo npm install -g darlene --unsafe-perm=true --allow-root
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
sudo npm install -g darlene --unsafe-perm=true --allow-root
```

## Locally

```sh
npm uninstall -g .

# Note: If you get an 'EACCES' error run the command below instead
sudo npm install -g . --unsafe-perm=true --allow-root
```

---

MIT &copy; 2019-present (Zero-1729)
