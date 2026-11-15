const bcrypt = require('bcrypt');

const password = bcrypt.hash('admin', 10).then(hash => console.log(hash));