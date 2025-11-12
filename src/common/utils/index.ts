import Extension from "@contentstack/app-sdk";
import { get, isEmpty, keys } from "lodash";

export function getAppLocation(sdk: Extension): string {
  const locations = keys((sdk as any)?.location);
  let locationName = "";
  for (let i = 0; i <= locations.length; i++) {
    if (!isEmpty(get(sdk, `location.${locations[i]}`, undefined))) {
      locationName = locations[i];
      break;
    }
  }
  return locationName;
}

export function contentTypeField(schema: any, path = "") {
  const pathsUid = [];
  for (let schemaPos = 0; schemaPos < schema.length; schemaPos++) {
    if (schema[schemaPos].data_type === "blocks") {
      for (let modulerPos = 0; modulerPos < schema[schemaPos].blocks.length; modulerPos++) {
        let newPath =
          path !== ""
            ? `${path}.${schema[schemaPos].uid}[${modulerPos}].${schema[schemaPos].blocks[modulerPos].uid}`
            : `${schema[schemaPos].uid}[${modulerPos}].${schema[schemaPos].blocks[modulerPos].uid}`;
        const newUids: any = contentTypeField(schema[schemaPos].blocks[modulerPos].schema, newPath);
        if (newUids.length > 0) pathsUid.push(...newUids);
      }
    } else if (schema[schemaPos].data_type === "global_field" || schema[schemaPos].data_type === "group") {
      let newPath;
      if (schema[schemaPos].multiple) {
        newPath = path !== "" ? `${path}.${schema[schemaPos].uid}[0]` : `${schema[schemaPos].uid}`;
      } else {
        newPath = path !== "" ? `${path}.${schema[schemaPos].uid}` : `${schema[schemaPos].uid}`;
      }
      const newUids: any = contentTypeField(schema[schemaPos].schema, newPath);
      if (newUids.length > 0) pathsUid.push(...newUids);
    } else if (schema[schemaPos].data_type === "file") {
      const file = ["uid", "content_type"];
      file.forEach((item) => {
        let newPath = path !== "" ? `${path}.${schema[schemaPos].uid}.${item}` : `${schema[schemaPos].uid}.${item}`;
        pathsUid.push(newPath);
      });
    } else if (schema[schemaPos].data_type === "json") {
      // const dom = new JSDOM("");
      // let htmlDoc = dom.window.document.querySelector("body");
      // const jsonValue = htmlToJson(htmlDoc);
      // const data = flatten(jsonValue);
      // Object.keys(data).forEach((item) => {
      //   const obj: any = {};
      //   if (item === "type" || item === "uid") {
      //     let newPath =
      //       path !== ""
      //         ? `${path}.${schema[schemaPos].uid}.${item}`
      //         : `${schema[schemaPos].uid}.${item}`;
      //     obj[newPath] = data[item];
      //     pathsUid.push(obj);
      //   }
      //   let newPath =
      //     path !== ""
      //       ? `${path}.${schema[schemaPos].uid}.children`
      //       : `${schema[schemaPos].uid}.children`;
      //   obj[newPath] = data["children"];
      //   pathsUid.push(obj);
      // });
    } else {
      let newPath = path !== "" ? `${path}.${schema[schemaPos].uid}` : `${schema[schemaPos].uid}`;
      pathsUid.push(newPath);
    }
  }

  return pathsUid;
}

export const mergeObjects = (target: any, source: any) => {
  // Iterate through `source` properties and if an `Object` then
  // set property to merge of `target` and `source` properties
  Object.keys(source)?.forEach((key) => {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeObjects(target[key], source[key]));
    }
  });

  // Join `target` and modified `source`
  Object.assign(target || {}, source);
  return target;
};
