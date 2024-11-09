const jsonString = require("./data");
const data = JSON.parse(jsonString);
module.exports = (ids) => {
  let result = [];
//   console.log(ids);
  for (const type in data) {
    for (const name in data[type]) {
      if (ids.includes(data[type][name].id)) {
        // console.log(data[type][name]);
        result.push(data[type][name].name);
    }
    }
  }
  return result;
};
