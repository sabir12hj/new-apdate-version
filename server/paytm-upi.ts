import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { storage } from './storage';
import { InsertPayment } from '@shared/schema';

interface PaytmParams {
  MID: string;
  ORDER_ID: string;
  CUST_ID: string;
  INDUSTRY_TYPE_ID: string;
  CHANNEL_ID: string;
  TXN_AMOUNT: string;
  WEBSITE: string;
  CALLBACK_URL: string;
  EMAIL: string;
  MOBILE_NO?: string;
  CHECKSUMHASH: string;
}

interface UpiParams {
  merchantId: string;
  merchantTransactionId: string;
  amount: string;
  merchantUserId: string;
  redirectUrl: string;
  callbackUrl: string;
  mobileNumber?: string;
  paymentInstrument: {
    type: string;
    upiAddress?: string;
  };
}

// Generate checksum for Paytm transactions
const generateChecksum = async (params: any, merchantKey: string): Promise<string> => {
  try {
    // In production, replace with actual Paytm checksum generation logic
    // Either use their SDK or make API call to checksum generation endpoint
    const response = await axios.post(
      'https://securegw-stage.paytm.in/order/process',
      {
        ...params,
        CHECKSUMHASH: ''
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.CHECKSUMHASH;
  } catch (error) {
    console.error('Error generating checksum:', error);
    throw new Error('Failed to generate checksum');
  }
};

// Initialize Paytm payment
export const initializePaytmPayment = async (req: Request, res: Response) => {
  try {
    const { userId, tournamentId, amount, mobileNumber, email } = req.body;
    
    if (!userId || !tournamentId || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Check if user and tournament exist
    const user = await storage.getUser(userId);
    const tournament = await storage.getTournament(tournamentId);
    
    if (!user || !tournament) {
      return res.status(404).json({ error: 'User or tournament not found' });
    }
    
    // Generate unique order ID
    const orderId = `ORDER_${tournamentId}_${userId}_${Date.now()}`;
    
    // Prepare parameters for Paytm transaction
    const paytmParams: PaytmParams = {
      MID: process.env.PAYTM_MERCHANT_ID || '',
      ORDER_ID: orderId,
      CUST_ID: userId.toString(),
      INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE || 'Retail',
      CHANNEL_ID: process.env.PAYTM_CHANNEL_ID || 'WEB',
      TXN_AMOUNT: amount.toString(),
      WEBSITE: process.env.PAYTM_WEBSITE || 'WEBSTAGING',
      CALLBACK_URL: `${process.env.BACKEND_URL || ''}/api/payments/callback`,
      EMAIL: email || user.email,
      MOBILE_NO: mobileNumber || user.phone_number,
      CHECKSUMHASH: ''
    };
    
    // Generate checksum
    const merchantKey = process.env.PAYTM_MERCHANT_KEY || '';
    paytmParams.CHECKSUMHASH = await generateChecksum(paytmParams, merchantKey);
    
    // Store payment information
    const payment: InsertPayment = {
      user_id: userId,
      tournament_id: tournamentId,
      amount: amount.toString(),
      transaction_id: orderId,
      payment_status: 'PENDING',
      payment_method: 'PAYTM'
    };
    
    await storage.createPayment(payment);
    
    // Return payment information to client
    return res.status(200).json({
      success: true,
      params: paytmParams,
      url: process.env.NODE_ENV === 'production' 
        ? 'https://securegw.paytm.in/order/process' 
        : 'https://securegw-stage.paytm.in/order/process'
    });
    
  } catch (error) {
    console.error('Error initializing Paytm payment:', error);
    return res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

// Initialize UPI payment
export const initializeUpiPayment = async (req: Request, res: Response) => {
  try {
    const { userId, tournamentId, amount, upiId, mobileNumber } = req.body;
    
    if (!userId || !tournamentId || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Check if user and tournament exist
    const user = await storage.getUser(userId);
    const tournament = await storage.getTournament(tournamentId);
    
    if (!user || !tournament) {
      return res.status(404).json({ error: 'User or tournament not found' });
    }
    
    // Generate unique transaction ID
    const transactionId = `UPI_${uuidv4().slice(0, 8)}`;
    
    // Prepare UPI payment parameters
    const upiParams: UpiParams = {
      merchantId: process.env.PAYTM_MERCHANT_ID || '',
      merchantTransactionId: transactionId,
      amount: amount.toString(),
      merchantUserId: userId.toString(),
      redirectUrl: `${process.env.FRONTEND_URL || ''}/tournaments/${tournamentId}/payment/callback`,
      callbackUrl: `${process.env.BACKEND_URL || ''}/api/payments/upi/callback`,
      mobileNumber: mobileNumber || user.phone_number,
      paymentInstrument: {
        type: 'UPI_INTENT',
        upiAddress: upiId || user.upi_id
      }
    };
    
    // Store payment information
    const payment: InsertPayment = {
      user_id: userId,
      tournament_id: tournamentId,
      amount: amount.toString(),
      transaction_id: transactionId,
      payment_status: 'PENDING',
      payment_method: 'UPI'
    };
    
    await storage.createPayment(payment);
    
    // In a real implementation, you would make an API call to the payment gateway
    // For now, we'll return the parameters that would be used
    return res.status(200).json({
      success: true,
      params: upiParams,
      transactionId
    });
    
  } catch (error) {
    console.error('Error initializing UPI payment:', error);
    return res.status(500).json({ error: 'Failed to initialize UPI payment' });
  }
};

// Handle payment callback
export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    const { ORDERID, STATUS, TXNAMOUNT, TXNID, RESPMSG } = req.body;
    
    if (!ORDERID) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }
    
    // Find payment record
    const payments = await storage.getPaymentsByTransaction(ORDERID);
    
    if (!payments || payments.length === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    
    const payment = payments[0];
    
    // Update payment status
    await storage.updatePayment(payment.id, {
      payment_status: STATUS || 'UNKNOWN',
      transaction_id: TXNID || payment.transaction_id
    });
    
    // If payment is successful, add user as tournament participant
    if (STATUS === 'TXN_SUCCESS') {
      await storage.addParticipant({
        user_id: payment.user_id,
        tournament_id: payment.tournament_id,
        score: 0,
        time_taken: 0,
        prize: '0',
        has_attempted: false
      });
      
      // Redirect to success page
      return res.redirect(`${process.env.FRONTEND_URL || ''}/tournaments/${payment.tournament_id}/payment/success`);
    } else {
      // Redirect to failure page
      return res.redirect(`${process.env.FRONTEND_URL || ''}/tournaments/${payment.tournament_id}/payment/failure?reason=${encodeURIComponent(RESPMSG || 'Transaction failed')}`);
    }
    
  } catch (error) {
    console.error('Error processing payment callback:', error);
    return res.status(500).json({ error: 'Failed to process payment callback' });
  }
};

// Handle UPI payment callback
export const handleUpiCallback = async (req: Request, res: Response) => {
  try {
    const { merchantTransactionId, transactionId, resultInfo } = req.body;
    
    if (!merchantTransactionId) {
      return res.status(400).json({ error: 'Invalid callback data' });
    }
    
    // Find payment record
    const payments = await storage.getPaymentsByTransaction(merchantTransactionId);
    
    if (!payments || payments.length === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    
    const payment = payments[0];
    const status = resultInfo && resultInfo.resultStatus === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
    
    // Update payment status
    await storage.updatePayment(payment.id, {
      payment_status: status,
      transaction_id: transactionId || payment.transaction_id
    });
    
    // If payment is successful, add user as tournament participant
    if (status === 'SUCCESS') {
      await storage.addParticipant({
        user_id: payment.user_id,
        tournament_id: payment.tournament_id,
        score: 0,
        time_taken: 0,
        prize: '0',
        has_attempted: false
      });
      
      return res.status(200).json({ success: true });
    } else {
      return res.status(200).json({ 
        success: false, 
        message: resultInfo && resultInfo.resultMsg || 'Transaction failed' 
      });
    }
    
  } catch (error) {
    console.error('Error processing UPI callback:', error);
    return res.status(500).json({ error: 'Failed to process UPI payment callback' });
  }
};
