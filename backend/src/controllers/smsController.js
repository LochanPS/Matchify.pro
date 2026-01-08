import smsService from '../services/smsService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const testSMS = async (req, res) => {
  try {
    const { phoneNumber, templateName, data } = req.body;

    if (!phoneNumber || !templateName) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and template name are required'
      });
    }

    const result = await smsService.send(phoneNumber, templateName, data || {});

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: result
    });

  } catch (error) {
    console.error('[TEST SMS ERROR]', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSMSLogs = async (req, res) => {
  try {
    const { phoneNumber, status, page = 1, limit = 50 } = req.query;

    const where = {};
    if (phoneNumber) where.phoneNumber = phoneNumber;
    if (status) where.status = status;

    const logs = await prisma.smsLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.smsLog.count({ where });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('[GET SMS LOGS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMS logs'
    });
  }
};

export const getSMSStatus = async (req, res) => {
  try {
    const { twilioSid } = req.params;

    const status = await smsService.getStatus(twilioSid);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('[GET SMS STATUS ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMS status'
    });
  }
};
