import React from 'react';
import { Switch, Route } from 'react-router-dom';
import CollectionPage from './collection';
import HomePage from './home';
import TokenPage from './token';
import MyOrdersPage from './yourorders';
import FreshOrdersPage from './freshorders';
import FreshTradesPage from './freshtrades';
import { PurchaseDialog, BidDialog, Layout } from 'components';
import { CancelDialog } from 'components/CancelDialog/CancelDialog';
import { TransferDialog } from 'components/TransferDiaog/TransferDialog';
import { CollectionListPage } from './collection-list';
import MyNFTsPage from './mynfts';

export const Routing = () => (
  <Switch>
    <Route exact path="/">
      <Layout>
        <HomePage />
      </Layout>
    </Route>
    <Route path="/collections">
      <Layout>
        <CollectionListPage />
      </Layout>
    </Route>
    <Route path="/collection/:type/:address">
      <Layout fullWidth>
        <CollectionPage />
      </Layout>
    </Route>
    <Route path="/token/:type/:address/:id">
      <Layout>
        <CancelDialog />
        <PurchaseDialog />
        <BidDialog />
        <TransferDialog />
        <TokenPage />
      </Layout>
    </Route>
    <Route path="/freshoffers">
      <Layout>
        <PurchaseDialog />
        <FreshOrdersPage />
      </Layout>
    </Route>
    <Route path="/freshtrades">
      <Layout>
        <FreshTradesPage />
      </Layout>
    </Route>
    <Route path="/myoffers">
      <Layout>
        <CancelDialog />
        <PurchaseDialog />
        <MyOrdersPage />
      </Layout>
    </Route>
    <Route path="/mynfts">
      <Layout>
        <MyNFTsPage />
      </Layout>
    </Route>
  </Switch>
);
