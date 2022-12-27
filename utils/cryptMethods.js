const crypto = require('crypto');

const encryptState = (plain) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(process.env.CRYPTO_KEY, salt, 100000, 256/8, 'sha256');
  var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  cipher.write(plain);
  cipher.end()

  const encrypted = cipher.read();
  
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    encrypted: encrypted.toString('base64'),
    concatenned: Buffer.concat([salt, iv, encrypted]).toString('base64')
  }
}

const decryptState = (cyphState) => {
  encrypted = Buffer.from(cyphState, 'base64');
  const salt_len = iv_len = 16;
  
  const salt = encrypted.slice(0, salt_len);
  const iv = encrypted.slice(0+salt_len, salt_len+iv_len);
  const key = crypto.pbkdf2Sync(process.env.CRYPTO_KEY, salt, 100000, 256/8, 'sha256');
  
  decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  decipher.write(encrypted.slice(salt_len+iv_len));
  decipher.end();
  
  decrypted = decipher.read();
  return decrypted.toString()
}

module.exports = {
  encryptState,
  decryptState
}