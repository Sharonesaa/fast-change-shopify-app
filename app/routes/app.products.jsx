import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { Button, Card, IndexTable, Page, Pagination, Select, TextField, Thumbnail } from "@shopify/polaris";

import { getProducts, updateProducts } from "../services/product.server";
import { authenticate } from "../shopify.server";


export async function loader({ request }) {

    const url = new URL(request.url);
    const after = url.searchParams.get("after");
    const before = url.searchParams.get("before");
    const { admin } = await authenticate.admin(request);
    
    const { products, pageInfo } = await getProducts(admin.graphql, {
        first: 10,
        after,
        before
    });

    return Response.json({ products, pageInfo, admin });
};

export async function action({ request }) {
    try {
        const body = await request.json();
        const { admin } = await authenticate.admin(request);
        const updated = await updateProducts(admin.graphql, body.updatedProducts);

        return new Response(JSON.stringify({ success: true, results: updated }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("ERROR /app/products:", error);

        return new Response(JSON.stringify({
            success: false,
            message: error.message || "An unexpected error occurred on the server.",
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};

export default function ProductsPage() {

    const navigate = useNavigate();
    const fetcher = useFetcher();
    const shopify = useAppBridge();

    const { products: initialProducts, pageInfo, _ } = useLoaderData();
    const [products, setProducts] = useState(initialProducts);
    const [productsToUpdate, setProductsToUpdate] = useState({});
    const [applyInitials, setApplyInitials] = useState(true);
    const isSaving = fetcher.state !== "idle";

    useEffect(() => {
        if (applyInitials) {
            setProducts(initialProducts);
        } 
        // Prevent applying initialProducts after update inventoryAdjustQuantities
        // due to GraphQL sync delay. (update -> get).
    }, [initialProducts]);

    useEffect(() => {
        if (fetcher.data?.success) {
            shopify.toast.show("Saved successfully!");
            setApplyInitials(false);
            setTimeout(() => {
                setApplyInitials(true);
            }, 1000);
        } else if (fetcher.data?.success === false) {
            shopify.toast.show(fetcher.data.message || "Error updating products");
        }
    }, [fetcher.data]);

    const handleProductChange = (id, field, value) => {
        
        setProducts((prevProducts) =>
            prevProducts.map((product) => {
                if (product.id === id) {
                    const updatedProduct = { ...product, [field]: value };

                    setProductsToUpdate((prev) => {
                        const updated = { ...prev };
                        updated[id] ??= {};

                        switch (field) {
                            case "price":
                                updated[id][field] = {
                                    value,
                                    variantId: product.variantId,
                                };
                                break;
                            case "stock":
                                updated[id][field] = {
                                    inventoryItemId: product.inventoryItemId,
                                    locationId: product.locationId,
                                    delta: value - product.originalStock,
                                };
                                break;
                            default:
                                updated[id][field] = {
                                    value,
                                };
                                break;
                        }

                        return updated;
                    });

                    return updatedProduct;
                }
                return product;
            })
        );
    };

    const handleSave = async () => {
        
        fetcher.submit(
            JSON.stringify({ updatedProducts: productsToUpdate }),
            {
                method: "post",
                encType: "application/json"
            }
        );

        setProductsToUpdate({});
    };

    const rowMarkup = products.map((product, index) => (
        
        <IndexTable.Row id={product.id} key={product.id} position={index}>
            <IndexTable.Cell>
                <Thumbnail
                    source={product.image}
                    alt={product.altText || product.title}
                    size="small"
                />
            </IndexTable.Cell>

            <IndexTable.Cell>
                <TextField
                    value={product.title}
                    name={`title-${product.id}`}
                    onChange={(value) => handleProductChange(product.id, "title", value)}
                    autoComplete="off"
                />
            </IndexTable.Cell>

            <IndexTable.Cell>
                <TextField
                    type="number"
                    step={1}
                    value={String(product.stock)}
                    name={`stock-${product.id}`}
                    onChange={(value) => handleProductChange(product.id, "stock", Number(value))}
                    autoComplete="off"
                />
            </IndexTable.Cell>

            <IndexTable.Cell>
                <TextField
                    type="number"
                    step={0.1}
                    value={String(product.price)}
                    name={`price-${product.id}`}
                    onChange={(value) => handleProductChange(product.id, "price", parseFloat(value))}
                    autoComplete="off"
                />
            </IndexTable.Cell>

            <IndexTable.Cell>
                <Select
                    options={[
                        { label: 'Activo', value: 'ACTIVE' },
                        { label: 'Borrador', value: 'DRAFT' }
                    ]}
                    value={product.status}
                    name={`status-${product.id}`}
                    onChange={(value) => handleProductChange(product.id, "status", value)}
                />
            </IndexTable.Cell>
        </IndexTable.Row>
    ));

    return (
        <Page>
            <TitleBar title="Fast Change app">
                <button variant="primary" onClick={() => navigate("/app")}>
                    Home
                </button>
            </TitleBar>
            <Card>
                <IndexTable
                    resourceName={{ singular: "producto", plural: "productos" }}
                    itemCount={products.length}
                    headings={[
                        { title: "Imagen" },
                        { title: "Título" },
                        { title: "Stock" },
                        { title: "Precio" },
                        { title: "Estado" },
                    ]}
                    selectable={false}
                >
                    {rowMarkup}
                </IndexTable>
                <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
                    <Pagination
                        hasNext={pageInfo.hasNextPage}
                        hasPrevious={pageInfo.hasPreviousPage}
                        onNext={() => navigate(`?after=${pageInfo.endCursor}`)}
                        onPrevious={() => navigate(`?before=${pageInfo.startCursor}`)}
                    />

                    <Button primary loading={isSaving} disabled={isSaving} onClick={handleSave}>
                        Guardar cambios
                    </Button>
                </div>
            </Card>
        </Page>
    );
};
