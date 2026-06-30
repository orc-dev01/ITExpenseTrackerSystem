require('../config/env');

const { query } = require('../db/sql-server');

async function main() {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM app.Roles) AS roleCount,
      (SELECT COUNT(*) FROM app.Users) AS userCount,
      (SELECT COUNT(*) FROM app.Departments) AS departmentCount;
  `);

  const row = result.recordset[0];
  console.log(`Connected to SQL Server database ${process.env.DB_NAME || 'ITExpense'}.`);
  console.log(`Roles: ${row.roleCount}`);
  console.log(`Users: ${row.userCount}`);
  console.log(`Departments: ${row.departmentCount}`);
}

main().catch((error) => {
  console.error('SQL Server connection failed.');
  console.error(error.message);
  process.exit(1);
});
