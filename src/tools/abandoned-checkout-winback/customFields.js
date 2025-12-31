// Custom fields for winback segmentation/templates
let customFields = [];

function addField(field) {
  customFields.push(field);
}
function listFields() {
  return customFields;
}
function removeField(name) {
  customFields = customFields.filter(f => f.name !== name);
}

module.exports = { addField, listFields, removeField };
