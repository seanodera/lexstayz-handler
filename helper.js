const fs = require("fs");
const handlebars = require("handlebars");
const juice = require("juice");


// Helper function to compile HTML template with variables and inline CSS
exports.compileTemplateWithTailwind = (templatePath, cssPath, variables) => {
  // Read the HTML template
  const templateSource = fs.readFileSync(templatePath, "utf-8");
  const template = handlebars.compile(templateSource);
  const htmlContent = template(variables); // Insert dynamic variables

  // Read the compiled Tailwind CSS file
  const cssContent = fs.readFileSync(cssPath, "utf-8");
  return juice.inlineContent(htmlContent, cssContent);
};

