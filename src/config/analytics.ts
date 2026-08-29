// CONFIGURACIÓN GOOGLE ANALYTICS, GTM Y SEARCH CONSOLE
// ================================================
// EDITA ESTOS VALORES Y ELIMINA LOS COMENTARIOS DESEADOS

export const ANALYTICS = {
  // Google Analytics 4 (GA4)
  ga4: {
    measurementId: 'G-MGY4Q16N34',
  },

  // Google Tag Manager (GTM)
  gtm: {
    containerId: 'GTM-TCV97SLJ',
  },

  // Google Search Console (GSC)
  gsc: {
    verificationCode: '',  // ← Reemplazar con código de verificación
    // Opción A: Meta tag (recomendado)
    // <meta name="google-site-verification" content="XXXXXXXXXXXX" />
    //
    // Opción B: DNS TXT (Cloudflare)
    // Nombre: @ o mallas-barranquilla.com
    // Tipo: TXT
    // Valor: google-site-verification=XXXXXXXXXXXX
  }
};

// Google Business Profile (GBP) - Local SEO
export const GBP = {
  name: 'Mayprotec',
  phone: '+573024249707',
  whatsapp: '+573024249707',
  email: 'info@mallas-barranquilla.com',

  address: {
    streetAddress: 'Cl. 93 #71-49 LOCAL L2-211',
    addressLocality: 'Barranquilla',
    addressRegion: 'Atlántico',
    postalCode: '080002',
    addressCountry: 'CO'
  },

  coordinates: {
    latitude: 11.0196,
    longitude: -74.8289
  },

  hours: {
    weekday: '08:00-18:00',
    saturday: '08:00-13:00',
    sunday: 'Cerrado'
  }
};

// Event Tracking (CTA buttons, forms, etc.)
export const EVENTS = {
  whatsapp: {
    category: 'Contact',
    action: 'Click WhatsApp',
    label: 'Floating Button'
  },
  contactForm: {
    category: 'Lead',
    action: 'Form Submit',
    label: 'Contact Form'
  },
  pricing: {
    category: 'Engagement',
    action: 'Click',
    label: 'Pricing Tab'
  },
  blog: {
    category: 'Content',
    action: 'Read',
    label: 'Blog Article'
  }
};

export default ANALYTICS;