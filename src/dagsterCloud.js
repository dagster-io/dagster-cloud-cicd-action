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
mutation ($location: LocationSelector!) {
  addLocation(location: $location) {
     __typename
     ... on WorkspaceEntry {
       locationName
     }
     ... on PythonError {
       message
       stack
     }
  }
}
`;

const UPDATE_LOCATION_MUTATION = gql`
mutation ($location: LocationSelector!) {
  updateLocation(location: $location) {
     __typename
     ... on WorkspaceEntry {
       locationName
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
        "Dagster-Cloud-Api-Token": token,
      },
    });
  }

  async updateLocation(location) {
    const locationList = await this.gqlClient.request(LIST_LOCATION_QUERY);
    const locationNames = locationList.workspace.workspaceEntries.map(entry => entry.locationName);
    if (!locationNames.includes(location.name)) {
      return await this.gqlClient.request(ADD_LOCATION_MUTATION, {"location": location});
    } else {
      return await this.gqlClient.request(UPDATE_LOCATION_MUTATION, {"location": location});
    }
  }
}