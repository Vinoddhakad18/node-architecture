<%
const skipFields = [
  'created_by',
  'updated_by',
  'created_at',
  'updated_at'
];

const fieldList = (locals.fields || '')
  .split(',')
  .filter(Boolean)
  .filter(field => {
    const fieldName = field.split(':')[0].trim();
    return !skipFields.includes(fieldName);
  });
%>