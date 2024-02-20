import { Component, OnInit } from '@angular/core';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import prettyBytes from 'pretty-bytes';
import setupEditors, { EditorSetup } from './setupEditor';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ng-rest-client';
  editorSetup!: EditorSetup; // Add ! to indicate it's definitely assigned in the ngOnInit

  form!: any;
  queryParamsContainer!: HTMLElement;
  requestHeadersContainer!: HTMLElement;
  responseHeadersContainer!: HTMLElement;
  keyValueTemplate!: HTMLTemplateElement;
  requestEditor: any; // You might need to adjust this type based on the actual type returned from setupEditors
  updateResponseEditor: any; // You might need to adjust this type based on the actual type returned from setupEditors

  constructor() {}

  ngOnInit(): void {
    this.editorSetup = setupEditors();
    
    this.form = document.querySelector("[data-form]")!;
    this.queryParamsContainer = document.querySelector("[data-query-params]")!;
    this.requestHeadersContainer = document.querySelector("[data-request-headers]")!;
    this.responseHeadersContainer = document.querySelector("[data-response-headers]")!;
    this.keyValueTemplate = document.querySelector("[data-key-value-template]")!;

    document.querySelector("[data-add-query-param-btn]")!.addEventListener("click", () => {
      this.queryParamsContainer.append(this.createKeyValuePair());
    });

    document.querySelector("[data-add-request-header-btn]")!.addEventListener("click", () => {
      this.requestHeadersContainer.append(this.createKeyValuePair());
    });

    interface CustomAxiosRequestConfig extends AxiosRequestConfig {
      customData?: {
        startTime?: number;
      };
    }

    this.queryParamsContainer.append(this.createKeyValuePair());
    this.requestHeadersContainer.append(this.createKeyValuePair());

    axios.interceptors.request.use((request: CustomAxiosRequestConfig) => {
      request.customData = request.customData || {};
      request.customData.startTime = new Date().getTime();
      return request;
    });

    axios.interceptors.response.use(this.updateEndTime, e => {
      return Promise.reject(this.updateEndTime(e.response));
    });

    const { requestEditor, updateResponseEditor } = this.editorSetup;
    this.requestEditor = requestEditor;
    this.updateResponseEditor = updateResponseEditor;

    this.form.addEventListener("submit", (e: Event) => {
      e.preventDefault();

      let data;
      try {
        data = JSON.parse(this.requestEditor.state.doc.toString() || null);
      } catch (e) {
        alert("JSON data is malformed");
        return;
      }

      axios({
        url: (document.querySelector("[data-url]")! as any).value,
        method: (document.querySelector("[data-method]")! as any).value,        
        params: this.keyValuePairsToObjects(this.queryParamsContainer),
        headers: this.keyValuePairsToObjects(this.requestHeadersContainer),
        data,
      })
        .catch(e => e)
        .then(response => {
          document.querySelector("[data-response-section]")!.classList.remove("d-none");
          this.updateResponseDetails(response);
          this.updateResponseEditor(response.data);
          this.updateResponseHeaders(response.headers);
          console.log(response);
        });
    });
  }

  updateEndTime(response: any): AxiosResponse {
    response.customData = response.customData || {};
    response.customData.time = new Date().getTime() - response.config.customData.startTime;
    return response;
  }

  updateResponseDetails(response: any): void {
    document.querySelector("[data-status]")!.textContent = response.status.toString();
    document.querySelector("[data-time]")!.textContent = response.customData.time.toString();
    document.querySelector("[data-size]")!.textContent = prettyBytes(
      JSON.stringify(response.data).length +
      JSON.stringify(response.headers).length
    );
  }

  updateResponseHeaders(headers: any): void {
    this.responseHeadersContainer.innerHTML = "";
    Object.entries(headers).forEach(([key, value]) => {
      const keyElement = document.createElement("div");
      keyElement.textContent = key;
      this.responseHeadersContainer.append(keyElement);
      const valueElement: any = document.createElement("div");
      valueElement.textContent = value;
      this.responseHeadersContainer.append(valueElement);
    });
  }

  createKeyValuePair(): Node {
    const element: any = this.keyValueTemplate.content.cloneNode(true) as Node;
    element.querySelector("[data-remove-btn]")!.addEventListener("click", e => {
      (e.target as HTMLElement).closest("[data-key-value-pair]")!.remove();
    });
    return element;
  }

  keyValuePairsToObjects(container: HTMLElement): any {
    const pairs: any = container.querySelectorAll("[data-key-value-pair]");
    return [...pairs].reduce((data, pair) => {
      const key = (pair.querySelector("[data-key]") as HTMLInputElement).value;
      const value = (pair.querySelector("[data-value]") as HTMLInputElement).value;

      if (key === "") return data;
      return { ...data, [key]: value };
    }, {});
  }
}
