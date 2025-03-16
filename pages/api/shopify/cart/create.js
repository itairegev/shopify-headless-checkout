import { Shopify } from '@shopify/shopify-api'; // Server-side only

const countries = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AS', name: 'American Samoa' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguilla' },
  { code: 'AQ', name: 'Antarctica' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AW', name: 'Aruba' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BM', name: 'Bermuda' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BV', name: 'Bouvet Island' },
  { code: 'BR', name: 'Brazil' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  // ... add more countries as needed
].sort((a, b) => a.name.localeCompare(b.name));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      error: true 
    });
  }

  try {
    // Validate required fields
    if (!req.body.items || !req.body.customer) {
      throw new Error('Missing required fields');
    }

    // Initialize Shopify client
    if (!process.env.SHOPIFY_STORE_URL || !process.env.SHOPIFY_ACCESS_TOKEN) {
      throw new Error('Missing Shopify configuration');
    }

    const client = new Shopify.Clients.Rest(
      process.env.SHOPIFY_STORE_URL,
      process.env.SHOPIFY_ACCESS_TOKEN
    );

    // Create cart with items
    const cart = await client.post({
      path: 'cart/create',
      data: {
        items: req.body.items,
      },
    });

    if (!cart.body.cart || !cart.body.cart.id) {
      throw new Error('Failed to create cart');
    }

    // Generate checkout URL
    const checkout = await client.post({
      path: 'checkouts',
      data: {
        cart_id: cart.body.cart.id,
        email: req.body.customer.email,
      },
    });

    // Debug logging
    console.log('=== Checkout Debug Information ===');
    console.log('Cart ID:', cart.body.cart.id);
    console.log('Checkout Details:', checkout.body);
    console.log('Checkout URL:', checkout.body.checkout.web_url);
    console.log('===============================');

    return res.status(200).json({
      checkoutUrl: checkout.body.checkout.web_url,
    });

  } catch (error) {
    console.error('Shopify API error:', error);
    
    // Send appropriate error message to client
    let errorMessage = 'An error occurred while processing your order';
    if (error.message === 'Missing required fields') {
      errorMessage = 'Please fill in all required fields';
    } else if (error.message === 'Missing Shopify configuration') {
      errorMessage = 'Server configuration error';
    } else if (error.message === 'Failed to create cart') {
      errorMessage = 'Failed to create shopping cart';
    }

    return res.status(500).json({ 
      message: errorMessage,
      error: true
    });
  }
} 