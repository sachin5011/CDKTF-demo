import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import { databricksProvider, dataDatabricksCurrentUser, notebook, job } from "@cdktf/provider-databricks";
import * as vars from "./vars";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new DatabricksProvider(this, "databricksAuth", {})

    const currentUser = new DataDatabricksCurrentUser(this, "currentUser", {});

    // Define the notebook.
    const notebook = new Notebook(this, "notebook", {
      path: `${currentUser.home}/CDKTF/${vars.resourcePrefix}-notebook.py`,
      language: "PYTHON",
      contentBase64: Buffer.from("display(spark.range(10))", "utf8").toString("base64")
    });

    // Define the job to run the notebook.
    const job = new Job(this, "job", {
      name: `${vars.resourcePrefix}-job`,
      newCluster: {
        numWorkers: vars.numWorkers,
        sparkVersion: vars.sparkVersion,
        nodeTypeId: vars.nodeTypeId
      },
      notebookTask: {
        notebookPath: `${currentUser.home}/CDKTF/${vars.resourcePrefix}-notebook.py`
      },
      emailNotifications: {
        onSuccess: [ currentUser.userName ],
        onFailure: [ currentUser.userName ]
      }
    });

    // Output the notebook and job URLs.
    new TerraformOutput(this, "Notebook URL", {
      value: notebook.url
    });

    new TerraformOutput(this, "Job URL", {
      value: job.url
    });
  }
}

const app = new App();
new MyStack(app, "cdktf-demo");
app.synth();
