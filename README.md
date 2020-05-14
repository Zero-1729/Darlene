# Darlene

A Symmetric Encryption Tool.

![darlene](./darlene.png)

---

**Note**: When Darlene encrypts data, be it a text/binary file, array, string/JSON or Buffer, she outputs a [darlene (drln) file](./docs/darlene_file_format.md), which allows Darlene preserve the necessary metadata for decrypting the data later on.

---

> **Tip**: After decrypting, remember to convert back to `Buffer`; hex/base64 string is returned. 
> 
> Check [the sample code](./examples/buffer/buffer.js) for more info.

- Darlene can encrypt just about anything:
    - [x] JSON
    - [x] String/Plain text
    - [x] Buffer
    - [x] Arrays (using JSON)
    - [x] Plain Text, JSON, & Binary files

- and only decrypt [Darlene (drln) files](./docs/darlene_file_format.md).

## Note on JSON and Binary Content

Ensure to include the binary flag (`-B`) when encrypting binary files. Usually these are files that display garbage data when opened in a text editor, e.g. '.png', '.pdf', '.docx', '.exe', '.AppImage', etc. As for JSON content, use the json flag (`-J` or `--json`) when encryptin JSON files.

Without the above flags, both encrypted JSON and Binary files would not be properly decrypted back to their original formats.

> **Caution**: If you are decrypting binary content that requires exec (`+x`) permissions, include the `-X` or `--exec` flag. You could also use the flag if you aren't sure whether the binary content being decrypted would require exec permissions.

---

# Upgrading from version 0.5.x

After the `v0.6.0` release, the [drln file structure](./docs/darlene_file_format.md) was changed to make reading the drln file data easier, and to also make discovery of drln files easier as they now begin with the 4 Byte magic number '`44 4E 17 29`' (or '`DN\u0017)`' when decoded using 'utf-8').

If you are trying to decrypt an older drln file created by `darlene` v0.5.x or older, include the `-legacy` or `-L` flag.

**Note**: If you are not sure whether a drln file is a legacy drln file, try decrypting normally (i.e. `$ darlene -f [drln file] -o [output file] -D ...`), if you get the following error: "`darlene: Darlene file contains an invalid magic number.`", then it is likely that the drln file is a legacy file, as legacy files had no magic number, which means you should include the legacy flag (`-L` or `--legacy`). Additionally, if after adding the legacy flag you get the following error: "`darlene: Darlene file does not have a valid version number.`", then it is likely that the file is not a drln file.

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
