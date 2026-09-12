export interface ProductDetails {
  orderId: string;
  variantId: string;
  title: string;
  imageUrl: string;
  handle: string;
  platforms: string[];
  tags: string[];
  displayTags?: string[];
  revealDate: string;
  categories: string[];
  productType: string;
  variantTitle: string;
  selectedOptions: { name: string; value: string }[];
}
