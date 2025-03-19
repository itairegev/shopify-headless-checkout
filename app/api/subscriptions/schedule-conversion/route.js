import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { draftOrderId, userId, conversionDate } = await req.json();

    // Store the scheduled conversion in your database
    const scheduledConversion = {
      draftOrderId,
      userId,
      conversionDate: new Date(conversionDate),
      status: 'scheduled'
    };

    // await db.scheduledConversions.create(scheduledConversion);

    // This endpoint will be called by a CRON job that runs daily
    // The CRON job will check for scheduled conversions and process them

    return NextResponse.json({
      success: true,
      scheduled: scheduledConversion
    });

  } catch (error) {
    console.error('Failed to schedule conversion:', error);
    return NextResponse.json(
      { error: 'Failed to schedule conversion' },
      { status: 500 }
    );
  }
}

// This function will be called by your CRON job
export async function processScheduledConversions() {
  try {
    const now = new Date();
    
    // Get all scheduled conversions that are due
    // const dueConversions = await db.scheduledConversions.findMany({
    //   where: {
    //     conversionDate: { lte: now },
    //     status: 'scheduled'
    //   }
    // });

    // For demonstration, using a mock conversion
    const dueConversions = [];

    for (const conversion of dueConversions) {
      try {
        // Complete the draft order to activate the subscription
        const response = await fetch(
          `https://${process.env.SHOPIFY_SHOP_NAME}/admin/api/2024-01/draft_orders/${conversion.draftOrderId}/complete.json`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
            }
          }
        );

        const data = await response.json();

        if (data.draft_order?.status === 'completed') {
          // Update conversion status in database
          // await db.scheduledConversions.update({
          //   where: { id: conversion.id },
          //   data: { status: 'completed' }
          // });

          // Send confirmation email
          // await sendSubscriptionStartedEmail(conversion.userId);
        }
      } catch (error) {
        console.error(`Failed to process conversion ${conversion.id}:`, error);
        // Log error and continue with next conversion
        continue;
      }
    }

    return { success: true, processed: dueConversions.length };
  } catch (error) {
    console.error('Failed to process scheduled conversions:', error);
    throw error;
  }
} 