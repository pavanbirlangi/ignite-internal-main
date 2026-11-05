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
  // The order is still processing (payment held or keys not assigned yet): no keys means
  // "being prepared", not "no keys available".
  awaitingKeys?: boolean;
}
