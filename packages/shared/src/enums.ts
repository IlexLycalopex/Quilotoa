export enum Role {
  BDE = 'BDE',
  PRE_SALES = 'PRE_SALES',
  TEAM_LEAD = 'TEAM_LEAD',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
}

export enum Stage {
  QUALIFICATION = 'QUALIFICATION',
  DISCOVERY = 'DISCOVERY',
  COI = 'COI',
  ROI = 'ROI',
  COMPLETE = 'COMPLETE',
}

export enum Solution {
  SAGE_X3 = 'SAGE_X3',
  SAGE_INTACCT = 'SAGE_INTACCT',
  X3CLOUDDOCS = 'X3CLOUDDOCS',
  MIXED = 'MIXED',
}

export enum DocumentType {
  COI_SUMMARY = 'COI_SUMMARY',
  ROI_BUSINESS_CASE = 'ROI_BUSINESS_CASE',
  DISCOVERY_SUMMARY = 'DISCOVERY_SUMMARY',
}

export enum BudgetStatus {
  CONFIRMED = 'CONFIRMED',
  INDICATIVE = 'INDICATIVE',
  UNKNOWN = 'UNKNOWN',
}

export enum SizeBand {
  SME = 'SME',
  MID = 'MID',
  ENTERPRISE = 'ENTERPRISE',
}

export enum ProductionModel {
  MTO = 'MTO',
  MTS = 'MTS',
  ETO = 'ETO',
}

export enum MigrationScope {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  NONE = 'NONE',
}

export enum ItReadiness {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  FINAL = 'FINAL',
}

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum Resource {
  OPPORTUNITY = 'OPPORTUNITY',
  ORGANISATION = 'ORGANISATION',
  USER = 'USER',
  TENANT = 'TENANT',
  QUALIFICATION = 'QUALIFICATION',
  DISCOVERY = 'DISCOVERY',
  FINANCIAL_MODEL = 'FINANCIAL_MODEL',
  PROPOSAL = 'PROPOSAL',
}

export enum ScopeFilter {
  OWN = 'OWN',
  TEAM = 'TEAM',
  ALL = 'ALL',
}
