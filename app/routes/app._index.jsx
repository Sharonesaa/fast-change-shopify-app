import { useNavigate } from "@remix-run/react";
import { Page, Layout, Text, Card, Button, BlockStack, List, Link, InlineStack,} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return null;
};

export default function Index() {

    const navigate = useNavigate();

    return (
        <Page>
            <TitleBar title="Fast Change app">
                <button variant="primary" onClick={() => navigate("/app/products")}>
                    Let's go!
                </button>
            </TitleBar>
            <BlockStack gap="500">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="500">
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingMd">
                                        🐌 What is FastChange?
                                    </Text>
                                    <Text variant="bodyMd" as="p">
                                        FastChange is a tool built for Shopify merchants who need to quickly update
                                        product data. It connects to your stor's GraphQL database and makes it easy
                                        to manage key product fields without digging through each item manually.
                                    </Text>
                                </BlockStack>
                                <BlockStack gap="200">
                                    <Text as="h3" variant="headingMd">
                                        ⚡ Fast and Simple Editing
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                        Edit product titles, stock, prices, and status all in one place. With a single click,
                                        you can apply changes instantly—saving time and keeping your catalog up to date effortlessly.
                                    </Text>
                                </BlockStack>
                                <InlineStack gap="300">
                                    <Button onClick={() => navigate("/app/products")}>
                                        Take Me There!
                                    </Button>
                                </InlineStack>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                    <Layout.Section variant="oneThird">
                        <BlockStack gap="500">
                            <Card>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingMd">
                                        🚀 Coming Soon!
                                    </Text>
                                    <List>
                                        <List.Item>
                                            Filters
                                        </List.Item>
                                    </List>
                                </BlockStack>
                            </Card>
                            <Card>
                                <BlockStack gap="200">
                                    <Text as="h2" variant="headingMd">
                                        App template specs
                                    </Text>
                                    <BlockStack gap="200">
                                        <InlineStack align="space-between">
                                            <Text as="span" variant="bodyMd">
                                                Framework
                                            </Text>
                                            <Link
                                                url="https://remix.run"
                                                target="_blank"
                                                removeUnderline
                                            >
                                                Remix
                                            </Link>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                            <Text as="span" variant="bodyMd">
                                                Database
                                            </Text>
                                            <Link
                                                url="https://www.prisma.io/"
                                                target="_blank"
                                                removeUnderline
                                            >
                                                Prisma
                                            </Link>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                            <Text as="span" variant="bodyMd">
                                                Interface
                                            </Text>
                                            <span>
                                                <Link
                                                    url="https://polaris.shopify.com"
                                                    target="_blank"
                                                    removeUnderline
                                                >
                                                    Polaris
                                                </Link>
                                                {", "}
                                                <Link
                                                    url="https://shopify.dev/docs/apps/tools/app-bridge"
                                                    target="_blank"
                                                    removeUnderline
                                                >
                                                    App Bridge
                                                </Link>
                                            </span>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                            <Text as="span" variant="bodyMd">
                                                API
                                            </Text>
                                            <Link
                                                url="https://shopify.dev/docs/api/admin-graphql"
                                                target="_blank"
                                                removeUnderline
                                            >
                                                GraphQL API
                                            </Link>
                                        </InlineStack>
                                    </BlockStack>
                                </BlockStack>
                            </Card>
                        </BlockStack>
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}
