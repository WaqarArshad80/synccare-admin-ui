// Types for the PointClickCare (PCC) integration endpoints. Only the fields the
// UI displays are typed; the real payloads carry many more (see /api-docs).

export interface Paging {
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

/** PCC list endpoints wrap results as { data, paging }. */
export interface PccCollection<T> {
  data: T[];
  paging?: Paging;
}

export interface Facility {
  id?: string | null;
  facId: number;
  facilityName: string;
  city?: string;
  state?: string;
  bedCount?: number;
  healthType?: string;
  facilityStatus?: string;
  active?: boolean;
  orgUuid?: string;
  lineOfBusiness?: { shortDesc?: string; longDesc?: string };
}

export interface Patient {
  patientId: number;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  patientStatus?: string;
  facId?: number;
  roomDesc?: string;
  admissionDate?: string;
  medicalRecordNumber?: string;
}

export interface Allergy {
  allergyIntoleranceId?: number;
  allergen?: string;
  type?: string;
  category?: string;
  clinicalStatus?: string;
  severity?: string;
  reactionType?: string;
  onsetDate?: string;
}

export interface Condition {
  conditionId?: number;
  icd10?: string;
  icd10Description?: string;
  clinicalStatus?: string;
  rankDescription?: string;
  principalDiagnosis?: boolean;
  onsetDate?: string;
  resolvedDate?: string;
}

export interface Medication {
  orderId?: number;
  description?: string;
  generic?: string;
  strength?: string;
  strengthUOM?: string;
  directions?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  residentName?: string;
}

export interface Observation {
  observationId?: number;
  type?: string;
  value?: number;
  unit?: string;
  systolicValue?: number;
  diastolicValue?: number;
  method?: string;
  recordedDate?: string;
  recordedBy?: string;
}

export interface ProgressNote {
  id?: string;
  progressNoteId?: number;
  noteType?: string;
  progressNoteType?: string;
  effectiveDate?: string;
  focus?: string;
  createdBy?: string;
  createdDate?: string;
  facId?: number;
}

export interface ProgressNoteType {
  progressNoteTypeId?: number;
  noteType?: string;
  facId?: number;
  highPriority?: boolean;
  showOnShiftReport?: boolean;
  showOn24HourReport?: boolean;
}

/** Sync endpoints return either a plain message or a map of counts. */
export type SyncResult = string | Record<string, number>;

/** MongoDB extended-JSON wrappers the backend sometimes emits. */
type MongoDate = { $date?: string };
type MongoId = { $oid?: string };

/** A stored PCC webhook delivery (GET /syncare/webhook-logs). Dates may arrive
 *  as plain ISO strings or Mongo `{ $date }` wrappers. */
export interface WebhookLog {
  _id?: MongoId | string;
  messageId?: string;
  eventType?: string;
  eventSubType?: string;
  /** The raw event JSON, stored as a string. */
  payload?: string;
  patientId?: number;
  resourceId?: string;
  orgId?: number;
  orgUuid?: string;
  facId?: number;
  status?: string;
  processingDetails?: string;
  receivedAt?: MongoDate | string;
  processedAt?: MongoDate | string;
  messageDate?: MongoDate | string;
  eventDate?: MongoDate | string;
  contentType?: string;
  sourceIp?: string;
}

/** A PCC API call that failed and is queued for retry (GET /pending-api-calls). */
export interface PendingApiCall {
  id?: string;
  method?: string;
  url?: string;
  reason?: string;
  organizationId?: string;
  orgUuid?: string;
  createdAt?: string;
}

/** One org's subscription state within a webhook subscription. */
export interface WebhookOrgSubscription {
  action?: string;
  orgUuid?: string;
  status?: string;
}

/** A PCC webhook subscription (GET /syncare/pcc/webhooks/subscriptions). */
export interface WebhookSubscription {
  webhookSubscriptionId?: number;
  action?: string;
  applicationName?: string;
  applicationType?: string;
  status?: string;
  username?: string;
  endUrl?: string;
  eventGroupList?: string[];
  currentSubscription?: WebhookOrgSubscription[];
  enableRoomReservationCancellation?: boolean;
  includeDischarged?: boolean;
  includeOutpatient?: boolean;
  vendorExternalId?: string | null;
  createdDate?: string;
  revisionDate?: string;
}
