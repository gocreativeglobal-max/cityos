import ProductDetail from '@/components/cityos/ProductDetail';
import { getCityMartProduct, getProductReviewsBundle } from '@/app/actions/commerce';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  let initialProduct = null;
  let initialReviews = null;

  try {
    initialProduct = await getCityMartProduct(id);
    if (!initialProduct) {
      notFound();
    }
    if (initialProduct?.organizationId) {
      initialReviews = await getProductReviewsBundle(initialProduct.organizationId);
    }
  } catch (err) {
    console.error('Error fetching product server-side:', err);
  }

  return (
    <ProductDetail 
      id={id} 
      initialProduct={initialProduct} 
      initialReviews={initialReviews} 
    />
  );
}
