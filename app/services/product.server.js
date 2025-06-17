export async function getProducts(graphql, { first = 10, after = null, before = null } = {}) {
    
    const variables = {};
    let paginationDirective;
    let variableDeclarations;

    if (after) {
        variables.first = first;
        variables.after = after;
        paginationDirective = "(first: $first, after: $after)";
        variableDeclarations = "$first: Int, $after: String";
    } else if (before) {
        variables.last = first;
        variables.before = before;
        paginationDirective = "(last: $last, before: $before)";
        variableDeclarations = "$last: Int, $before: String";
    } else {
        variables.first = first;
        paginationDirective = "(first: $first)";
        variableDeclarations = "$first: Int";
    }

    const query = `
        query getProducts(${variableDeclarations}) {
            products${paginationDirective} {
                pageInfo {
                    hasPreviousPage
                    hasNextPage
                    startCursor  
                    endCursor
                }
                edges {
                    cursor
                    node {
                        id
                        title
                        status
                        totalInventory
                        images(first: 1) {
                            nodes {
                                url
                                altText
                            }
                        }
                        variants(first: 1) {
                            edges {
                                node {
                                    id
                                    price
                                    inventoryItem {
                                        id
                                        tracked
                                    }
                                }
                            }
                        }
                    }
                }
            }
            locations(first: 1) {
                edges {
                    node {
                        id
                        name
                    }
                }
            }
        }
    `;

    const response = await graphql(query, { variables });
    const data = await response.json();

    const locationId = data.data.locations.edges[0]?.node?.id || null;

    const products = data.data.products.edges.map(({ cursor, node }) => {
        const variant = node.variants.edges[0]?.node;

        return {
            cursor,
            id: node.id,
            title: node.title,
            image: node.images.nodes[0]?.url || null,
            status: node.status,
            stock: node.totalInventory,
            originalStock: node.totalInventory,
            altText: node.images.nodes[0]?.altText || "",
            price: variant?.price || "N/A",
            variantId: variant?.id || null,
            inventoryItemId: variant?.inventoryItem?.id || null,
            tracked: variant?.inventoryItem?.tracked || false,
            locationId,
        };
    });

    return {
        products,
        pageInfo: data.data.products.pageInfo,
    };
};

export async function updateProducts(graphql, updatedProducts) {
    
    const results = [];

    for (const [productId, changes] of Object.entries(updatedProducts)) {
        const result = {
            productId,
            errors: [],
        };

        if (changes.title || changes.status) {
            const productInput = {
                id: productId,
            };

            if (changes.title) productInput.title = changes.title.value;
            if (changes.status) productInput.status = changes.status.value;

            const productUpdateRes = await graphql(
                `
                    mutation productUpdate($input: ProductInput!) {
                        productUpdate(input: $input) {
                            product {
                                id
                                title
                                status
                            }
                            userErrors {
                                field
                                message
                            }
                        }
                    }
                `,
                {
                    variables: { input: productInput },
                }
            );

            const productUpdateData = productUpdateRes?.body?.data?.productUpdate;
            if (productUpdateData?.userErrors?.length > 0) {
                result.errors.push(...productUpdateData.userErrors);
            }
        };

        if (changes.price) {
            const variantUpdateRes = await graphql(
                `
                    mutation productVariantsBulkUpdate(
                        $productId: ID!
                        $variants: [ProductVariantsBulkInput!]!
                    ) {
                        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                            productVariants {
                                id
                                price
                            }
                            userErrors {
                                field
                                message
                            }
                        }
                    }
                `,
                {
                    variables: {
                        productId,
                        variants: [
                            {
                                id: changes.price.variantId,
                                price: changes.price.value,
                            },
                        ],
                    },
                }
            );

            const variantUpdateData = variantUpdateRes?.body?.data?.productVariantsBulkUpdate;
            if (variantUpdateData?.userErrors?.length > 0) {
                result.errors.push(...variantUpdateData.userErrors);
            }
        };

        if (changes.stock) {
            const stock = changes.stock;

            const inventoryUpdateRes = await graphql(
                `
                    mutation adjustQuantities($input: InventoryAdjustQuantitiesInput!) {
                        inventoryAdjustQuantities(input: $input) {
                            userErrors {
                                field
                                message
                            }
                            inventoryAdjustmentGroup {
                                reason
                                changes {
                                    name
                                    delta
                                }
                            }
                        }
                    }
                `,
                {
                    variables: {
                        input: {
                            name: "available",
                            reason: "correction",
                            changes: [
                                {
                                    inventoryItemId: stock.inventoryItemId,
                                    locationId: stock.locationId,
                                    delta: stock.delta,
                                },
                            ],
                        },
                    },
                }
            );

            const inventoryUpdateData = inventoryUpdateRes?.body?.data?.inventoryAdjustQuantities;
            if (inventoryUpdateData?.userErrors?.length > 0) {
                result.errors.push(...inventoryUpdateData.userErrors);
            }
        };

        results.push(result);
    };
    return results;
};
