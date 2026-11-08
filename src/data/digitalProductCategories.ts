export interface DigitalProductCategory {
  id: string;
  label: string;
  search_terms: string[];
}

export const DIGITAL_PRODUCT_CATEGORIES: DigitalProductCategory[] = [
  { id: 'software_saas', label: 'Software & SaaS', search_terms: ['software companies', 'SaaS platforms', 'business software'] },
  { id: 'custom_software', label: 'Custom Software & Systems', search_terms: ['custom software development', 'systems integration', 'enterprise application development'] },
  { id: 'web_mobile_apps', label: 'Web & Mobile Applications', search_terms: ['web application development', 'mobile app development', 'digital platforms'] },
  { id: 'ai_automation', label: 'AI, Machine Learning & Automation', search_terms: ['artificial intelligence', 'machine learning', 'business process automation', 'generative AI'] },
  { id: 'cloud_devops', label: 'Cloud, Hosting & DevOps', search_terms: ['cloud computing', 'cloud migration', 'hosting providers', 'DevOps'] },
  { id: 'cybersecurity', label: 'Cybersecurity', search_terms: ['cybersecurity', 'information security', 'security operations', 'penetration testing'] },
  { id: 'data_analytics', label: 'Data, Analytics & Business Intelligence', search_terms: ['data analytics', 'business intelligence', 'data engineering', 'data management'] },
  { id: 'enterprise_software', label: 'ERP, CRM & Enterprise Systems', search_terms: ['ERP', 'CRM', 'HR software', 'enterprise resource planning', 'enterprise systems'] },
  { id: 'fintech_payments', label: 'FinTech & Digital Payments', search_terms: ['financial technology', 'payment processing', 'digital banking', 'payment platforms'] },
  { id: 'ecommerce_marketplaces', label: 'E-commerce & Marketplaces', search_terms: ['e-commerce platforms', 'online marketplaces', 'digital commerce'] },
  { id: 'telecom_networking', label: 'Telecommunications & Networking', search_terms: ['telecommunications', 'network infrastructure', 'internet service providers', 'unified communications'] },
  { id: 'iot_hardware', label: 'IoT, Hardware & Embedded Systems', search_terms: ['Internet of Things', 'connected devices', 'embedded systems', 'smart sensors'] },
  { id: 'digital_marketing', label: 'Digital Marketing & AdTech', search_terms: ['digital marketing', 'marketing technology', 'advertising technology', 'customer engagement platforms'] },
  { id: 'digital_content', label: 'Digital Media & Content', search_terms: ['digital media', 'content platforms', 'streaming', 'creative technology'] },
  { id: 'gis_mapping', label: 'GIS, Mapping & Location Intelligence', search_terms: ['geographic information systems', 'GIS', 'mapping software', 'location intelligence'] },
  { id: 'edtech', label: 'Education Technology', search_terms: ['education technology', 'learning management systems', 'online learning platforms'] },
  { id: 'healthtech', label: 'Health Technology', search_terms: ['health technology', 'digital health', 'health information systems', 'telehealth'] },
  { id: 'govtech', label: 'Government & Civic Technology', search_terms: ['government technology', 'public sector software', 'digital government services'] },
  { id: 'proptech', label: 'Property & Construction Technology', search_terms: ['property technology', 'construction technology', 'building management software'] },
  { id: 'logistics_tech', label: 'Logistics & Supply Chain Technology', search_terms: ['logistics technology', 'supply chain software', 'fleet management systems'] },
  { id: 'it_services', label: 'IT Consulting & Managed Services', search_terms: ['IT consulting', 'managed IT services', 'technology support', 'systems maintenance'] },
];

export function expandDigitalProductCategory(category: string): string[] {
  const normalized = category.trim().toLocaleLowerCase();
  const match = DIGITAL_PRODUCT_CATEGORIES.find((item) => item.id === normalized || item.label.toLocaleLowerCase() === normalized);
  return match ? [match.label, ...match.search_terms] : [];
}
