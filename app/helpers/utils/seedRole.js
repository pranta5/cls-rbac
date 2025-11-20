const roleModel = require("../../models/role.model");

const seedRoles = async () => {
  try {
    const roles = [
      {
        name: "admin",
        permission: [
          "create_record",
          "read_record",
          "update_record",
          "delete_record",
        ],
      },
      {
        name: "manager",
        permission: ["create_record", "read_record", "update_record"],
      },
      {
        name: "employee",
        permission: ["create_record", "read_record"],
      },
    ];

    // Prevent duplicate seeding
    const existing = await roleModel.find();
    if (existing.length > 0) {
      console.log("Roles already exist, skipping seeding.");
      return;
    }

    await roleModel.insertMany(roles);
    console.log("Roles seeded successfully");
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
};

module.exports = seedRoles;
