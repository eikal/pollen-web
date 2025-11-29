/**
 * Script to generate Excel test data files for MVP testing.
 * Run with: node backend/scripts/generate-test-excel.js
 */

const ExcelJS = require('exceljs');
const path = require('path');

async function generateEmployeesExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Employees');

  // Define columns
  sheet.columns = [
    { header: 'employee_id', key: 'employee_id', width: 15 },
    { header: 'first_name', key: 'first_name', width: 15 },
    { header: 'last_name', key: 'last_name', width: 15 },
    { header: 'email', key: 'email', width: 30 },
    { header: 'department', key: 'department', width: 20 },
    { header: 'hire_date', key: 'hire_date', width: 15 },
    { header: 'salary', key: 'salary', width: 12 },
    { header: 'is_active', key: 'is_active', width: 10 },
  ];

  // Sample employee data
  const employees = [
    { employee_id: 'EMP001', first_name: 'John', last_name: 'Smith', email: 'john.smith@company.com', department: 'Engineering', hire_date: '2020-01-15', salary: 85000, is_active: true },
    { employee_id: 'EMP002', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@company.com', department: 'Marketing', hire_date: '2019-06-20', salary: 72000, is_active: true },
    { employee_id: 'EMP003', first_name: 'Michael', last_name: 'Williams', email: 'michael.williams@company.com', department: 'Sales', hire_date: '2021-03-10', salary: 68000, is_active: true },
    { employee_id: 'EMP004', first_name: 'Emily', last_name: 'Brown', email: 'emily.brown@company.com', department: 'Engineering', hire_date: '2020-08-05', salary: 92000, is_active: true },
    { employee_id: 'EMP005', first_name: 'David', last_name: 'Jones', email: 'david.jones@company.com', department: 'HR', hire_date: '2018-11-12', salary: 65000, is_active: true },
    { employee_id: 'EMP006', first_name: 'Jessica', last_name: 'Davis', email: 'jessica.davis@company.com', department: 'Finance', hire_date: '2019-02-28', salary: 78000, is_active: true },
    { employee_id: 'EMP007', first_name: 'Christopher', last_name: 'Miller', email: 'chris.miller@company.com', department: 'Engineering', hire_date: '2022-01-03', salary: 88000, is_active: true },
    { employee_id: 'EMP008', first_name: 'Amanda', last_name: 'Wilson', email: 'amanda.wilson@company.com', department: 'Marketing', hire_date: '2020-05-18', salary: 70000, is_active: true },
    { employee_id: 'EMP009', first_name: 'Daniel', last_name: 'Moore', email: 'daniel.moore@company.com', department: 'Sales', hire_date: '2021-07-22', salary: 72000, is_active: true },
    { employee_id: 'EMP010', first_name: 'Stephanie', last_name: 'Taylor', email: 'stephanie.taylor@company.com', department: 'Operations', hire_date: '2019-09-14', salary: 75000, is_active: true },
    { employee_id: 'EMP011', first_name: 'Robert', last_name: 'Anderson', email: 'robert.anderson@company.com', department: 'Engineering', hire_date: '2018-04-30', salary: 105000, is_active: true },
    { employee_id: 'EMP012', first_name: 'Jennifer', last_name: 'Thomas', email: 'jennifer.thomas@company.com', department: 'HR', hire_date: '2020-10-08', salary: 62000, is_active: true },
    { employee_id: 'EMP013', first_name: 'William', last_name: 'Jackson', email: 'william.jackson@company.com', department: 'Finance', hire_date: '2021-02-15', salary: 82000, is_active: true },
    { employee_id: 'EMP014', first_name: 'Nicole', last_name: 'White', email: 'nicole.white@company.com', department: 'Marketing', hire_date: '2022-04-25', salary: 68000, is_active: true },
    { employee_id: 'EMP015', first_name: 'James', last_name: 'Harris', email: 'james.harris@company.com', department: 'Sales', hire_date: '2019-12-01', salary: 76000, is_active: true },
    { employee_id: 'EMP016', first_name: 'Melissa', last_name: 'Martin', email: 'melissa.martin@company.com', department: 'Operations', hire_date: '2020-03-20', salary: 71000, is_active: true },
    { employee_id: 'EMP017', first_name: 'Andrew', last_name: 'Garcia', email: 'andrew.garcia@company.com', department: 'Engineering', hire_date: '2021-09-07', salary: 90000, is_active: true },
    { employee_id: 'EMP018', first_name: 'Rebecca', last_name: 'Martinez', email: 'rebecca.martinez@company.com', department: 'HR', hire_date: '2022-06-12', salary: 58000, is_active: true },
    { employee_id: 'EMP019', first_name: 'Kevin', last_name: 'Robinson', email: 'kevin.robinson@company.com', department: 'Finance', hire_date: '2018-08-22', salary: 95000, is_active: true },
    { employee_id: 'EMP020', first_name: 'Laura', last_name: 'Clark', email: 'laura.clark@company.com', department: 'Marketing', hire_date: '2019-04-10', salary: 74000, is_active: false },
    { employee_id: 'EMP021', first_name: 'Thomas', last_name: 'Rodriguez', email: 'thomas.rodriguez@company.com', department: 'Sales', hire_date: '2020-11-30', salary: 69000, is_active: true },
    { employee_id: 'EMP022', first_name: 'Ashley', last_name: 'Lewis', email: 'ashley.lewis@company.com', department: 'Operations', hire_date: '2021-01-18', salary: 67000, is_active: true },
    { employee_id: 'EMP023', first_name: 'Brian', last_name: 'Lee', email: 'brian.lee@company.com', department: 'Engineering', hire_date: '2019-07-05', salary: 98000, is_active: true },
    { employee_id: 'EMP024', first_name: 'Michelle', last_name: 'Walker', email: 'michelle.walker@company.com', department: 'HR', hire_date: '2022-02-28', salary: 60000, is_active: true },
    { employee_id: 'EMP025', first_name: 'Steven', last_name: 'Hall', email: 'steven.hall@company.com', department: 'Finance', hire_date: '2020-06-15', salary: 80000, is_active: false },
  ];

  // Add rows
  employees.forEach(emp => sheet.addRow(emp));

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Save file
  const filePath = path.join(__dirname, '../../test-data/employees.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`Created: ${filePath}`);
}

async function generateCustomersExcel() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Customers');

  // Define columns
  sheet.columns = [
    { header: 'customer_id', key: 'customer_id', width: 15 },
    { header: 'company_name', key: 'company_name', width: 25 },
    { header: 'contact_name', key: 'contact_name', width: 20 },
    { header: 'email', key: 'email', width: 30 },
    { header: 'phone', key: 'phone', width: 18 },
    { header: 'city', key: 'city', width: 15 },
    { header: 'country', key: 'country', width: 15 },
    { header: 'signup_date', key: 'signup_date', width: 12 },
    { header: 'is_subscribed', key: 'is_subscribed', width: 12 },
  ];

  // Sample customer data
  const customers = [
    { customer_id: 'CUST001', company_name: 'Acme Corporation', contact_name: 'John Doe', email: 'john@acme.com', phone: '+1-555-0101', city: 'New York', country: 'USA', signup_date: '2023-01-15', is_subscribed: true },
    { customer_id: 'CUST002', company_name: 'TechStart Inc', contact_name: 'Jane Smith', email: 'jane@techstart.com', phone: '+1-555-0102', city: 'San Francisco', country: 'USA', signup_date: '2023-02-20', is_subscribed: true },
    { customer_id: 'CUST003', company_name: 'Global Traders', contact_name: 'Bob Wilson', email: 'bob@globaltraders.com', phone: '+44-20-1234', city: 'London', country: 'UK', signup_date: '2023-03-10', is_subscribed: true },
    { customer_id: 'CUST004', company_name: 'Local Shop Ltd', contact_name: 'Alice Brown', email: 'alice@localshop.com', phone: '+1-555-0103', city: 'Chicago', country: 'USA', signup_date: '2023-04-05', is_subscribed: false },
    { customer_id: 'CUST005', company_name: 'Enterprise Solutions', contact_name: 'Charlie Davis', email: 'charlie@enterprise.com', phone: '+1-555-0104', city: 'Boston', country: 'USA', signup_date: '2023-05-18', is_subscribed: true },
    { customer_id: 'CUST006', company_name: 'Small Business Co', contact_name: 'Diana Miller', email: 'diana@smallbiz.com', phone: '+1-555-0105', city: 'Seattle', country: 'USA', signup_date: '2023-06-22', is_subscribed: true },
    { customer_id: 'CUST007', company_name: 'European Imports', contact_name: 'Erik Schmidt', email: 'erik@euroimports.de', phone: '+49-30-5678', city: 'Berlin', country: 'Germany', signup_date: '2023-07-14', is_subscribed: true },
    { customer_id: 'CUST008', company_name: 'Pacific Trading', contact_name: 'Yuki Tanaka', email: 'yuki@pacifictrading.jp', phone: '+81-3-9012', city: 'Tokyo', country: 'Japan', signup_date: '2023-08-08', is_subscribed: false },
    { customer_id: 'CUST009', company_name: 'Southern Distributors', contact_name: 'Maria Garcia', email: 'maria@southern.com', phone: '+1-555-0106', city: 'Miami', country: 'USA', signup_date: '2023-09-25', is_subscribed: true },
    { customer_id: 'CUST010', company_name: 'Northern Supplies', contact_name: 'Lars Svensson', email: 'lars@northern.se', phone: '+46-8-3456', city: 'Stockholm', country: 'Sweden', signup_date: '2023-10-12', is_subscribed: true },
    { customer_id: 'CUST011', company_name: 'Midwest Manufacturing', contact_name: 'Tom Johnson', email: 'tom@midwest.com', phone: '+1-555-0107', city: 'Detroit', country: 'USA', signup_date: '2023-11-03', is_subscribed: true },
    { customer_id: 'CUST012', company_name: 'Coastal Services', contact_name: 'Sarah Lee', email: 'sarah@coastal.com', phone: '+1-555-0108', city: 'Los Angeles', country: 'USA', signup_date: '2023-12-01', is_subscribed: false },
    { customer_id: 'CUST013', company_name: 'Mountain Ventures', contact_name: 'Mike Chen', email: 'mike@mountain.com', phone: '+1-555-0109', city: 'Denver', country: 'USA', signup_date: '2024-01-15', is_subscribed: true },
    { customer_id: 'CUST014', company_name: 'Valley Tech', contact_name: 'Lisa Park', email: 'lisa@valleytech.com', phone: '+1-555-0110', city: 'Austin', country: 'USA', signup_date: '2024-02-20', is_subscribed: true },
    { customer_id: 'CUST015', company_name: 'Island Imports', contact_name: 'James Cook', email: 'james@islandimports.com', phone: '+61-2-7890', city: 'Sydney', country: 'Australia', signup_date: '2024-03-10', is_subscribed: true },
    { customer_id: 'CUST016', company_name: 'Prairie Partners', contact_name: 'Kate Williams', email: 'kate@prairie.com', phone: '+1-555-0111', city: 'Dallas', country: 'USA', signup_date: '2024-04-05', is_subscribed: false },
    { customer_id: 'CUST017', company_name: 'Metro Services', contact_name: 'David Kim', email: 'david@metroservices.com', phone: '+1-555-0112', city: 'Philadelphia', country: 'USA', signup_date: '2024-05-18', is_subscribed: true },
    { customer_id: 'CUST018', company_name: 'River Trading', contact_name: 'Emma Thompson', email: 'emma@rivertrading.com', phone: '+44-161-2345', city: 'Manchester', country: 'UK', signup_date: '2024-06-22', is_subscribed: true },
    { customer_id: 'CUST019', company_name: 'Desert Solutions', contact_name: 'Carlos Ruiz', email: 'carlos@desert.com', phone: '+1-555-0113', city: 'Phoenix', country: 'USA', signup_date: '2024-07-14', is_subscribed: true },
    { customer_id: 'CUST020', company_name: 'Forest Products', contact_name: 'Nancy White', email: 'nancy@forestproducts.com', phone: '+1-555-0114', city: 'Portland', country: 'USA', signup_date: '2024-08-08', is_subscribed: false },
    { customer_id: 'CUST021', company_name: 'Urban Innovations', contact_name: 'Peter Black', email: 'peter@urban.com', phone: '+1-555-0115', city: 'Atlanta', country: 'USA', signup_date: '2024-09-25', is_subscribed: true },
    { customer_id: 'CUST022', company_name: 'Rural Resources', contact_name: 'Helen Green', email: 'helen@rural.com', phone: '+1-555-0116', city: 'Nashville', country: 'USA', signup_date: '2024-10-12', is_subscribed: true },
    { customer_id: 'CUST023', company_name: 'Alpine Industries', contact_name: 'Hans Mueller', email: 'hans@alpine.ch', phone: '+41-44-6789', city: 'Zurich', country: 'Switzerland', signup_date: '2024-11-03', is_subscribed: true },
    { customer_id: 'CUST024', company_name: 'Tropical Exports', contact_name: 'Ana Silva', email: 'ana@tropical.br', phone: '+55-11-0123', city: 'Sao Paulo', country: 'Brazil', signup_date: '2024-11-15', is_subscribed: false },
    { customer_id: 'CUST025', company_name: 'Arctic Supplies', contact_name: 'Ole Hansen', email: 'ole@arctic.no', phone: '+47-22-4567', city: 'Oslo', country: 'Norway', signup_date: '2024-11-20', is_subscribed: true },
    { customer_id: 'CUST026', company_name: 'Central Systems', contact_name: 'Mark Turner', email: 'mark@central.com', phone: '+1-555-0117', city: 'Minneapolis', country: 'USA', signup_date: '2024-11-22', is_subscribed: true },
    { customer_id: 'CUST027', company_name: 'Eastern Logistics', contact_name: 'Wei Zhang', email: 'wei@eastern.cn', phone: '+86-21-8901', city: 'Shanghai', country: 'China', signup_date: '2024-11-23', is_subscribed: true },
    { customer_id: 'CUST028', company_name: 'Western Wholesale', contact_name: 'Amy Roberts', email: 'amy@western.com', phone: '+1-555-0118', city: 'Las Vegas', country: 'USA', signup_date: '2024-11-24', is_subscribed: false },
    { customer_id: 'CUST029', company_name: 'Harbor Commerce', contact_name: 'Paul Martin', email: 'paul@harbor.com', phone: '+1-555-0119', city: 'San Diego', country: 'USA', signup_date: '2024-11-25', is_subscribed: true },
    { customer_id: 'CUST030', company_name: 'Summit Group', contact_name: 'Rachel Adams', email: 'rachel@summit.com', phone: '+1-555-0120', city: 'Salt Lake City', country: 'USA', signup_date: '2024-11-26', is_subscribed: true },
    { customer_id: 'CUST031', company_name: 'Gateway Solutions', contact_name: 'Steve Clark', email: 'steve@gateway.com', phone: '+1-555-0121', city: 'St. Louis', country: 'USA', signup_date: '2024-11-27', is_subscribed: true },
    { customer_id: 'CUST032', company_name: 'Peninsula Partners', contact_name: 'Linda Hall', email: 'linda@peninsula.com', phone: '+1-555-0122', city: 'Tampa', country: 'USA', signup_date: '2024-11-27', is_subscribed: false },
    { customer_id: 'CUST033', company_name: 'Lakeside Industries', contact_name: 'George Baker', email: 'george@lakeside.com', phone: '+1-555-0123', city: 'Cleveland', country: 'USA', signup_date: '2024-11-27', is_subscribed: true },
    { customer_id: 'CUST034', company_name: 'Bayview Trading', contact_name: 'Susan Young', email: 'susan@bayview.com', phone: '+1-555-0124', city: 'Oakland', country: 'USA', signup_date: '2024-11-28', is_subscribed: true },
    { customer_id: 'CUST035', company_name: 'Hillside Wholesale', contact_name: 'Chris Evans', email: 'chris@hillside.com', phone: '+1-555-0125', city: 'Pittsburgh', country: 'USA', signup_date: '2024-11-28', is_subscribed: true },
    { customer_id: 'CUST036', company_name: 'Parkway Distributors', contact_name: 'Donna Scott', email: 'donna@parkway.com', phone: '+1-555-0126', city: 'Cincinnati', country: 'USA', signup_date: '2024-11-28', is_subscribed: false },
    { customer_id: 'CUST037', company_name: 'Riverside Corp', contact_name: 'Frank Morris', email: 'frank@riverside.com', phone: '+1-555-0127', city: 'Kansas City', country: 'USA', signup_date: '2024-11-28', is_subscribed: true },
    { customer_id: 'CUST038', company_name: 'Oceanfront Ltd', contact_name: 'Grace Hill', email: 'grace@oceanfront.com', phone: '+1-555-0128', city: 'Honolulu', country: 'USA', signup_date: '2024-11-28', is_subscribed: true },
    { customer_id: 'CUST039', company_name: 'Canyon Ventures', contact_name: 'Henry Wright', email: 'henry@canyon.com', phone: '+1-555-0129', city: 'Tucson', country: 'USA', signup_date: '2024-11-28', is_subscribed: true },
    { customer_id: 'CUST040', company_name: 'Meadow Enterprises', contact_name: 'Irene King', email: 'irene@meadow.com', phone: '+1-555-0130', city: 'Orlando', country: 'USA', signup_date: '2024-11-28', is_subscribed: false },
  ];

  // Add rows
  customers.forEach(cust => sheet.addRow(cust));

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Save file
  const filePath = path.join(__dirname, '../../test-data/customers.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`Created: ${filePath}`);
}

async function main() {
  console.log('Generating Excel test files...\n');
  
  try {
    await generateEmployeesExcel();
    await generateCustomersExcel();
    console.log('\nAll Excel files generated successfully!');
  } catch (error) {
    console.error('Error generating Excel files:', error);
    process.exit(1);
  }
}

main();
