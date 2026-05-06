// Environment Variable Validation Utility
// This ensures all required environment variables are present before the server starts

import colors from 'colors';

const REQUIRED_ENV_VARS = {
  // Database
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL database connection string',
    example: 'postgresql://user:pass@host:5432/dbname'
  },
  
  // JWT Configuration
  JWT_SECRET: {
    required: true,
    description: 'Secret key for JWT token generation',
    minLength: 32
  },
  JWT_REFRESH_SECRET: {
    required: true,
    description: 'Secret key for JWT refresh token generation',
    minLength: 32
  },
  JWT_EXPIRES_IN: {
    required: false,
    default: '7d',
    description: 'JWT token expiration time'
  },
  JWT_REFRESH_EXPIRES_IN: {
    required: false,
    default: '30d',
    description: 'JWT refresh token expiration time'
  },
  
  // CORS Configuration
  FRONTEND_URL: {
    required: true,
    description: 'Frontend application URL for CORS',
    example: 'https://www.matchify.pro'
  },
  CORS_ORIGIN: {
    required: true,
    description: 'Allowed CORS origins (comma-separated)',
    example: 'https://www.matchify.pro,https://matchify-pro.vercel.app'
  },
  
  // Server Configuration
  NODE_ENV: {
    required: false,
    default: 'development',
    description: 'Node environment (development/production)'
  },
  PORT: {
    required: false,
    default: '5000',
    description: 'Server port number'
  },
  
  // Cloudinary (Image Upload)
  CLOUDINARY_CLOUD_NAME: {
    required: true,
    description: 'Cloudinary cloud name for image uploads'
  },
  CLOUDINARY_API_KEY: {
    required: true,
    description: 'Cloudinary API key'
  },
  CLOUDINARY_API_SECRET: {
    required: true,
    description: 'Cloudinary API secret'
  },
  
  // Payment Gateway
  RAZORPAY_KEY_ID: {
    required: false,
    description: 'Razorpay payment gateway key ID'
  },
  RAZORPAY_KEY_SECRET: {
    required: false,
    description: 'Razorpay payment gateway secret'
  },
  
  // Email Service
  SENDGRID_API_KEY: {
    required: false,
    description: 'SendGrid API key for email service'
  }
};

export function validateEnvironment() {
  console.log('\n' + '='.repeat(60));
  console.log(colors.cyan.bold('🔍 VALIDATING ENVIRONMENT VARIABLES'));
  console.log('='.repeat(60) + '\n');
  
  const missing = [];
  const warnings = [];
  const configured = [];
  
  // Check each required environment variable
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key];
    
    if (!value) {
      if (config.required) {
        missing.push({
          key,
          description: config.description,
          example: config.example
        });
      } else {
        // Set default value if available
        if (config.default) {
          process.env[key] = config.default;
          warnings.push({
            key,
            message: `Using default value: ${config.default}`
          });
        } else {
          warnings.push({
            key,
            message: 'Optional - Not configured'
          });
        }
      }
    } else {
      // Validate minimum length if specified
      if (config.minLength && value.length < config.minLength) {
        missing.push({
          key,
          description: `${config.description} (minimum ${config.minLength} characters)`,
          example: config.example
        });
      } else {
        configured.push({
          key,
          description: config.description
        });
      }
    }
  });
  
  // Display configured variables
  if (configured.length > 0) {
    console.log(colors.green.bold('✅ CONFIGURED VARIABLES:'));
    configured.forEach(({ key, description }) => {
      const maskedValue = maskSensitiveValue(key, process.env[key]);
      console.log(colors.green(`  ✓ ${key}: ${maskedValue}`));
    });
    console.log('');
  }
  
  // Display warnings
  if (warnings.length > 0) {
    console.log(colors.yellow.bold('⚠️  WARNINGS:'));
    warnings.forEach(({ key, message }) => {
      console.log(colors.yellow(`  ⚠  ${key}: ${message}`));
    });
    console.log('');
  }
  
  // Display missing variables
  if (missing.length > 0) {
    console.log(colors.red.bold('❌ MISSING REQUIRED VARIABLES:'));
    missing.forEach(({ key, description, example }) => {
      console.log(colors.red(`  ✗ ${key}`));
      console.log(colors.gray(`    Description: ${description}`));
      if (example) {
        console.log(colors.gray(`    Example: ${example}`));
      }
    });
    console.log('');
    console.log(colors.red.bold('🚨 SERVER CANNOT START - MISSING REQUIRED ENVIRONMENT VARIABLES'));
    console.log(colors.yellow('\n📝 To fix this:'));
    console.log(colors.yellow('1. Go to Vercel Dashboard'));
    console.log(colors.yellow('2. Select your backend project'));
    console.log(colors.yellow('3. Go to Settings → Environment Variables'));
    console.log(colors.yellow('4. Add the missing variables listed above'));
    console.log(colors.yellow('5. Redeploy the application\n'));
    console.log('='.repeat(60) + '\n');
    
    // Exit with error code
    process.exit(1);
  }
  
  console.log(colors.green.bold('✅ ALL REQUIRED ENVIRONMENT VARIABLES ARE CONFIGURED'));
  console.log('='.repeat(60) + '\n');
  
  return true;
}

// Mask sensitive values for logging
function maskSensitiveValue(key, value) {
  const sensitiveKeys = [
    'SECRET', 'PASSWORD', 'KEY', 'TOKEN', 'API_KEY', 
    'API_SECRET', 'DATABASE_URL', 'WEBHOOK_SECRET'
  ];
  
  const isSensitive = sensitiveKeys.some(sensitive => 
    key.toUpperCase().includes(sensitive)
  );
  
  if (isSensitive && value) {
    if (value.length <= 8) {
      return '***';
    }
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  }
  
  return value;
}

// Get environment status for health check
export function getEnvironmentStatus() {
  const status = {
    configured: [],
    missing: [],
    warnings: []
  };
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key];
    
    if (!value) {
      if (config.required) {
        status.missing.push({
          key,
          description: config.description,
          severity: 'critical'
        });
      } else {
        status.warnings.push({
          key,
          description: config.description,
          severity: 'warning'
        });
      }
    } else {
      status.configured.push({
        key,
        value: maskSensitiveValue(key, value),
        description: config.description
      });
    }
  });
  
  return status;
}

export default validateEnvironment;
