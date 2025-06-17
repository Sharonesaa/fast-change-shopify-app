import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import { AppProvider, Box, Button, Card, Layout, Page, Text, TextField } from "@shopify/polaris";
import { useState } from "react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";


export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();
  const [shop, setShop] = useState("");

  return (
    <AppProvider i18n={{}}>
      <Page title="FastChange: Product Updates Made Easy">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <Text as="h2" variant="headingMd">
                Quickly update product titles, prices, inventory, and status. No deep catalog digging required.
              </Text>

              {showForm && (
                <Form method="post" action="/auth/login">
                  <Box paddingBlockStart="400">
                    <TextField
                      label="Shop domain"
                      value={shop}
                      onChange={setShop}
                      name="shop"
                      placeholder="e.g: my-shop-domain.myshopify.com"
                      autoComplete="off"
                    />
                  </Box>
                  <Box paddingBlockStart="400">
                    <Button submit primary>Log in</Button>
                  </Box>
                </Form>
              )}

              <ul style={{ marginTop: "1rem", paddingLeft: "1.5rem" }}>
                <li>
                  <Text as="span" fontWeight="semibold">Real-time editing</Text>: Apply changes instantly through a fast and intuitive interface.
                </li>
                <li>
                  <Text as="span" fontWeight="semibold">GraphQL integration</Text>: Connects directly to your store’s GraphQL API.
                </li>
                <li>
                  <Text as="span" fontWeight="semibold">Save time</Text>: Update multiple products at once.
                </li>
              </ul>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}
