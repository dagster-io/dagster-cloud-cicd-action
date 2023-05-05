const {GraphQLClient, gql} = require('graphql-request');

const LIST_LOCATION_QUERY = gql`
  query WorkspaceEntries {
    workspace {
      workspaceEntries {
        locationName
        serializedDeploymentMetadata
      }
    }
  }
`;

const ADD_LOCATION_MUTATION = gql`
  mutation ($document: GenericScalar!) {
    addLocationFromDocument(document: $document) {
      __typename
      ... on WorkspaceEntry {
        locationName
      }
      ... on InvalidLocationError {
        errors
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

const UPDATE_LOCATION_MUTATION = gql`
  mutation ($document: GenericScalar!) {
    updateLocationFromDocument(document: $document) {
      __typename
      ... on WorkspaceEntry {
        locationName
      }
      ... on InvalidLocationError {
        errors
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

const CREATE_CODE_PREVIEW_MUTATION = gql`
  mutation ($codePreview: CodePreviewInput!) {
    createCodePreview(codePreview: $codePreview) {
      __typename
      ... on CodePreview {
        id
      }
      ... on PythonError {
        message
        stack
      }
    }
  }
`;

export class DagsterCloudClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;

    this.gqlClient = new GraphQLClient(url, {
      headers: {
        'Dagster-Cloud-Api-Token': token,
      },
    });
  }

  async updateLocation(document) {
    const locationList = await this.gqlClient.request(LIST_LOCATION_QUERY);
    const locationNames = locationList.workspace.workspaceEntries.map(
      (entry) => entry.locationName,
    );

    let result;
    if (!locationNames.includes(document.location_name)) {
      const gql_result = await this.gqlClient.request(ADD_LOCATION_MUTATION, {
        document: document,
      });
      result = gql_result.addLocationFromDocument;
    } else {
      const gql_result = await this.gqlClient.request(UPDATE_LOCATION_MUTATION, {
        document: document,
      });
      result = gql_result.updateLocationFromDocument;
    }

    if (result.__typename == 'InvalidLocationError') {
      throw new Error('Invalid location:\n' + result.errors.join('\n'));
    }
    if (result.__typename === 'PythonError') {
      throw new Error(result.message);
    }

    return result.locationName;
  }

  async createCodePreview(codePreview) {
    const result = (
      await this.gqlClient.request(CREATE_CODE_PREVIEW_MUTATION, {
        codePreview: codePreview,
      })
    ).createCodePreview;

    if (result.__typename === 'PythonError') {
      throw new Error(result.message);
    }

    return result.id;
  }
}
