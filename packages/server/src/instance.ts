import { SurveyError, errorCodes } from "@dimah-survey/core";
import type {
  ArchiveSurveyInput,
  GuardContext,
  PublishSurveyInput,
  ResponseMutationInput,
  ResponseRecord,
  SavePartialInput,
  SaveSurveyInput,
  StartResponseInput,
  SubmitResponseInput,
  SurveyRecord,
  SurveyStore,
  ValidateResultInput,
} from "@dimah-survey/core";
import { createHandler } from "./handler";

export type DimahSurveyConfig = {
  database: SurveyStore;
  guard?: (context: GuardContext) => void | Promise<void>;
  /**
   * Required. Production passes a survey-core Model check against `definition`.
   * The memory adapter does not validate SurveyJS JSON.
   */
  validateResult: (input: ValidateResultInput) => void | Promise<void>;
  basePath?: string;
};

export type DimahSurveyApi = {
  saveSurvey(input: SaveSurveyInput, request?: Request): Promise<SurveyRecord>;
  publishSurvey(
    input: PublishSurveyInput,
    request?: Request,
  ): Promise<SurveyRecord>;
  archiveSurvey(
    input: ArchiveSurveyInput,
    request?: Request,
  ): Promise<SurveyRecord>;
  getSurvey(idOrSlug: string, request?: Request): Promise<SurveyRecord>;
  startResponse(
    input: StartResponseInput,
    request?: Request,
  ): Promise<ResponseRecord>;
  savePartial(
    input: SavePartialInput,
    request?: Request,
  ): Promise<ResponseRecord>;
  submitResponse(
    input: SubmitResponseInput,
    request?: Request,
  ): Promise<ResponseRecord>;
  abandonResponse(
    input: ResponseMutationInput,
    request?: Request,
  ): Promise<ResponseRecord>;
  reopenResponse(
    input: ResponseMutationInput,
    request?: Request,
  ): Promise<ResponseRecord>;
  getResponse(id: string, request?: Request): Promise<ResponseRecord>;
};

export function dimahSurvey(config: DimahSurveyConfig) {
  async function guard(
    operation: GuardContext["operation"],
    request?: Request,
  ) {
    await config.guard?.({ operation, request });
  }

  const api: DimahSurveyApi = {
    async saveSurvey(input, request) {
      await guard("saveSurvey", request);
      return config.database.saveSurvey(input);
    },
    async publishSurvey(input, request) {
      await guard("publishSurvey", request);
      return config.database.publishSurvey(input);
    },
    async archiveSurvey(input, request) {
      await guard("archiveSurvey", request);
      return config.database.archiveSurvey(input);
    },
    async getSurvey(idOrSlug, request) {
      await guard("getSurvey", request);
      const survey = await config.database.getSurvey(idOrSlug);
      if (!survey) {
        throw new SurveyError(
          errorCodes.SURVEY_NOT_FOUND,
          "Survey was not found.",
          404,
        );
      }
      return survey;
    },
    async startResponse(input, request) {
      await guard("startResponse", request);
      return config.database.startResponse(input);
    },
    async savePartial(input, request) {
      await guard("savePartial", request);
      return config.database.savePartial(input);
    },
    async submitResponse(input, request) {
      await guard("submitResponse", request);
      const current = await config.database.getResponse(input.id);
      if (!current) {
        throw new SurveyError(
          errorCodes.RESPONSE_NOT_FOUND,
          "Response was not found.",
          404,
        );
      }
      if (current.status !== "draft") {
        throw new SurveyError(
          errorCodes.RESPONSE_CLOSED,
          "Only a draft response can be submitted.",
          409,
        );
      }
      const data = input.data ?? current.data;
      try {
        await config.validateResult({ definition: current.definition, data });
      } catch (error) {
        if (error instanceof SurveyError) throw error;
        const message =
          error instanceof Error ? error.message : "Survey result is invalid.";
        throw new SurveyError(errorCodes.VALIDATION_FAILED, message, 400);
      }
      return config.database.submitResponse({ ...input, data });
    },
    async abandonResponse(input, request) {
      await guard("abandonResponse", request);
      return config.database.abandonResponse(input);
    },
    async reopenResponse(input, request) {
      await guard("reopenResponse", request);
      return config.database.reopenResponse(input);
    },
    async getResponse(id, request) {
      await guard("getResponse", request);
      const response = await config.database.getResponse(id);
      if (!response) {
        throw new SurveyError(
          errorCodes.RESPONSE_NOT_FOUND,
          "Response was not found.",
          404,
        );
      }
      return response;
    },
  };

  return {
    api,
    handler: (request: Request) =>
      createHandler(api, config.basePath ?? "")(request),
  };
}
